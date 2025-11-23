// src/services/cronService.ts

/**
 * @file Cron job service for automated tasks
 * This file handles all scheduled tasks for the Bill Mate system
 */

import cron from 'node-cron';
import { generateMonthlyBills } from './billService';
import {
  sendPaymentReminders,
  sendPaymentOverdueNotifications
} from './notificationService';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import logger from '@/lib/logger';

// Flag to track if cron jobs are already initialized
let isInitialized = false;

// Store scheduled tasks
const scheduledTasks: { [key: string]: any } = {};

/**
 * Initialize all cron jobs for the system
 */
export function initializeCronJobs(): void {
  if (isInitialized) {
    logger.warn('Cron jobs are already initialized', 'Cron');
    return;
  }

  logger.info('Initializing cron jobs...', 'Cron');

  try {
    // 1. Daily payment reminder (5 days before due date) - 9:00 AM
    scheduledTasks['paymentReminder5Days'] = cron.schedule(
      '0 9 * * *',
      async () => {
        logger.info('Running 5-day payment reminder job...', 'Cron');
        await runJobWithRetry('5-day-payment-reminder', async () => {
          const count = await sendPaymentReminders(5);
          logger.info(`Sent ${count} payment reminders (5 days before due)`, 'Cron', { count });
        });
      },
      {
        timezone: 'Asia/Bangkok'
      }
    );

    // 2. Daily payment reminder (1 day before due date) - 6:00 PM
    scheduledTasks['paymentReminder1Day'] = cron.schedule(
      '0 18 * * *',
      async () => {
        logger.info('Running 1-day payment reminder job...', 'Cron');
        await runJobWithRetry('1-day-payment-reminder', async () => {
          const count = await sendPaymentReminders(1);
          logger.info(`Sent ${count} payment reminders (1 day before due)`, 'Cron', { count });
        });
      },
      {
        timezone: 'Asia/Bangkok'
      }
    );

    // 3. Daily overdue payment notifications - 10:00 AM
    scheduledTasks['overdueNotifications'] = cron.schedule(
      '0 10 * * *',
      async () => {
        logger.info('Running overdue notifications job...', 'Cron');
        await runJobWithRetry('overdue-notifications', async () => {
          const count = await sendPaymentOverdueNotifications();
          logger.info(`Sent ${count} overdue notifications`, 'Cron', { count });
        });
      },
      {
        timezone: 'Asia/Bangkok'
      }
    );

    // 4. Monthly bill generation - 1st day of month at 8:00 AM
    scheduledTasks['monthlyBillGeneration'] = cron.schedule(
      '0 8 1 * *',
      async () => {
        logger.info('Running monthly bill generation job...', 'Cron');
        await runJobWithRetry('monthly-bill-generation', async () => {
          const result = await generateMonthlyBills();
          logger.info(result.message || 'Monthly bill generation completed', 'Cron', result);
        });
      },
      {
        timezone: 'Asia/Bangkok'
      }
    );

    // 5. Weekly notification cleanup - Sunday at 1:00 AM
    scheduledTasks['notificationCleanup'] = cron.schedule(
      '0 1 * * 0',
      async () => {
        logger.info('Running notification cleanup job...', 'Cron');
        await runJobWithRetry('notification-cleanup', async () => {
          await cleanupOldNotifications();
        });
      },
      {
        timezone: 'Asia/Bangkok'
      }
    );

    // Start all scheduled tasks
    Object.values(scheduledTasks).forEach(task => task.start());

    isInitialized = true;
    logger.info('All cron jobs initialized successfully', 'Cron', {
      jobs: Object.keys(scheduledTasks)
    });

  } catch (error) {
    logger.error('Failed to initialize cron jobs', error as Error, 'Cron');
    throw error;
  }
}

/**
 * Stop all cron jobs
 */
export function stopAllCronJobs(): void {
  logger.info('Stopping all cron jobs...', 'Cron');
  
  Object.entries(scheduledTasks).forEach(([name, task]) => {
    task.stop();
    logger.info(`Stopped: ${name}`, 'Cron');
  });

  isInitialized = false;
  logger.info('All cron jobs stopped', 'Cron');
}

/**
 * Get status of all cron jobs
 */
export function getCronJobStatus(): { [key: string]: boolean } {
  const status: { [key: string]: boolean } = {};
  
  Object.entries(scheduledTasks).forEach(([name, task]) => {
    status[name] = task.running || false;
  });

  return status;
}

/**
 * Run a specific cron job manually (for testing)
 */
export async function runJobManually(jobName: string): Promise<void> {
  logger.info(`Manually running job: ${jobName}`, 'Cron');
  
  switch (jobName) {
    case 'payment-reminder-5-days':
      await runJobWithRetry('5-day-payment-reminder', async () => {
        const count = await sendPaymentReminders(5);
        logger.info(`Sent ${count} payment reminders (5 days before due)`, 'Cron', { count });
      });
      break;
      
    case 'payment-reminder-1-day':
      await runJobWithRetry('1-day-payment-reminder', async () => {
        const count = await sendPaymentReminders(1);
        logger.info(`Sent ${count} payment reminders (1 day before due)`, 'Cron', { count });
      });
      break;
      
    case 'overdue-notifications':
      await runJobWithRetry('overdue-notifications', async () => {
        const count = await sendPaymentOverdueNotifications();
        logger.info(`Sent ${count} overdue notifications`, 'Cron', { count });
      });
      break;
      
    case 'monthly-bill-generation':
      await runJobWithRetry('monthly-bill-generation', async () => {
        const result = await generateMonthlyBills();
        logger.info(result.message || 'Monthly bill generation completed', 'Cron', result);
      });
      break;
      
    case 'notification-cleanup':
      await runJobWithRetry('notification-cleanup', async () => {
        await cleanupOldNotifications();
      });
      break;
      
    default:
      throw new Error(`Unknown job name: ${jobName}`);
  }
}

/**
 * Execute a job with retry logic and error handling
 */
async function runJobWithRetry(
  jobName: string, 
  jobFunction: () => Promise<void>, 
  maxRetries: number = 3
): Promise<void> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await jobFunction();
      return; // Success, exit the retry loop
    } catch (error) {
      retryCount++;
      logger.error(`Error in ${jobName} (attempt ${retryCount}/${maxRetries})`, error as Error, 'Cron', { retryCount, maxRetries });
      
      if (retryCount < maxRetries) {
        // Wait before retry (exponential backoff)
        const delayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retrying ${jobName} in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        console.error(`💀 ${jobName} failed after ${maxRetries} attempts`);
        // Here you could add error notification to admin
        throw error;
      }
    }
  }
}

/**
 * Clean up old notifications (older than 30 days and already read)
 */
async function cleanupOldNotifications(): Promise<void> {
  try {
    await connectDB();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      read: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    throw error;
  }
}

/**
 * Get next run times for all scheduled jobs
 */
export function getNextRunTimes(): { [key: string]: string } {
  const nextRuns: { [key: string]: string } = {};
  const now = new Date();
  
  // This is a simplified version - in production you might want more precise calculations
  nextRuns['paymentReminder5Days'] = getNextRunTime('0 9 * * *', now);
  nextRuns['paymentReminder1Day'] = getNextRunTime('0 18 * * *', now);
  nextRuns['overdueNotifications'] = getNextRunTime('0 10 * * *', now);
  nextRuns['monthlyBillGeneration'] = getNextRunTime('0 8 1 * *', now);
  nextRuns['notificationCleanup'] = getNextRunTime('0 1 * * 0', now);
  
  return nextRuns;
}

/**
 * Calculate next run time for a cron expression
 */
function getNextRunTime(cronExpression: string, fromDate: Date): string {
  // This is a simplified implementation
  // In production, you might want to use a library like 'cron-parser'
  const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ');
  
  const nextRun = new Date(fromDate);
  
  // Simple logic - this would need to be more sophisticated for edge cases
  if (day === '*' && dayOfWeek === '*') {
    // Daily job
    if (parseInt(hour) > fromDate.getHours() || 
        (parseInt(hour) === fromDate.getHours() && parseInt(minute) > fromDate.getMinutes())) {
      nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    } else {
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    }
  } else if (day === '1' && dayOfWeek === '*') {
    // Monthly job (1st day of month)
    if (fromDate.getDate() === 1) {
      if (parseInt(hour) > fromDate.getHours() || 
          (parseInt(hour) === fromDate.getHours() && parseInt(minute) > fromDate.getMinutes())) {
        nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
      } else {
        nextRun.setMonth(nextRun.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
      }
    } else {
      nextRun.setMonth(nextRun.getMonth() + 1);
      nextRun.setDate(1);
      nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
    }
  } else if (dayOfWeek === '0') {
    // Weekly job (Sunday)
    const daysUntilSunday = (7 - fromDate.getDay()) % 7 || 7;
    nextRun.setDate(nextRun.getDate() + daysUntilSunday);
    nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
  }
  
  return nextRun.toLocaleString('th-TH', { 
    timeZone: 'Asia/Bangkok',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

// Export initialization status
export { isInitialized };