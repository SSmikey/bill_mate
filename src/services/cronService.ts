// src/services/cronService.ts
import cron from 'node-cron';
import {
  sendPaymentReminders,
  sendPaymentOverdueNotifications
} from './notificationService';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

// Job 1: ส่ง reminder 5 วันก่อนครบกำหนด
// ทำงานทุกวันเวลา 09:00 (Asia/Bangkok)
export function startPaymentReminder5Days() {
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 [CRON] Running: 5-day payment reminder');
    console.log(`⏰ Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    try {
      const count = await sendPaymentReminders(5);
      console.log(`✅ [CRON] Sent ${count} payment reminders (5 days before due)`);
    } catch (error) {
      console.error('❌ [CRON] Error in 5-day reminder job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
  
  console.log('✅ Cron job initialized: 5-day payment reminder (09:00 daily)');
}

// Job 2: ส่ง reminder 1 วันก่อนครบกำหนด
// ทำงานทุกวันเวลา 18:00 (Asia/Bangkok)
export function startPaymentReminder1Day() {
  cron.schedule('0 18 * * *', async () => {
    console.log('🔔 [CRON] Running: 1-day payment reminder');
    console.log(`⏰ Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    try {
      const count = await sendPaymentReminders(1);
      console.log(`✅ [CRON] Sent ${count} payment reminders (1 day before due)`);
    } catch (error) {
      console.error('❌ [CRON] Error in 1-day reminder job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
  
  console.log('✅ Cron job initialized: 1-day payment reminder (18:00 daily)');
}

// Job 3: ส่ง overdue notifications
// ทำงานทุกวันเวลา 10:00 (Asia/Bangkok)
export function startOverdueNotifications() {
  cron.schedule('0 10 * * *', async () => {
    console.log('⚠️ [CRON] Running: Overdue payment notifications');
    console.log(`⏰ Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    try {
      const count = await sendPaymentOverdueNotifications();
      console.log(`✅ [CRON] Sent ${count} overdue notifications`);
    } catch (error) {
      console.error('❌ [CRON] Error in overdue notification job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
  
  console.log('✅ Cron job initialized: Overdue notifications (10:00 daily)');
}

// Job 4: Cleanup old notifications
// ทำงานทุกวันอาทิตย์เวลา 01:00 (Asia/Bangkok)
export function startNotificationCleanup() {
  cron.schedule('0 1 * * 0', async () => {
    console.log('🧹 [CRON] Running: Notification cleanup');
    console.log(`⏰ Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);
    
    try {
      await connectDB();
      
      // ลบ notifications ที่อ่านแล้วและเก่ากว่า 30 วัน
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        read: true,
        readAt: { $lt: thirtyDaysAgo }
      });

      console.log(`✅ [CRON] Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('❌ [CRON] Error in cleanup job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
  
  console.log('✅ Cron job initialized: Notification cleanup (01:00 every Sunday)');
}

// Initialize all cron jobs
// เรียกใช้ครั้งเดียวตอน server start
export function initializeCronJobs() {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 Initializing Cron Jobs System...');
  console.log('='.repeat(60));
  
  startPaymentReminder5Days();
  startPaymentReminder1Day();
  startOverdueNotifications();
  startNotificationCleanup();
  
  console.log('='.repeat(60));
  console.log('✅ All cron jobs initialized successfully!');
  console.log('📋 Active Jobs:');
  console.log('   1. 5-day payment reminder - Daily at 09:00');
  console.log('   2. 1-day payment reminder - Daily at 18:00');
  console.log('   3. Overdue notifications - Daily at 10:00');
  console.log('   4. Notification cleanup - Sunday at 01:00');
  console.log('='.repeat(60));
  console.log('');
}

// Export individual jobs for testing
export const cronJobs = {
  reminder5Days: startPaymentReminder5Days,
  reminder1Day: startPaymentReminder1Day,
  overdueNotifications: startOverdueNotifications,
  notificationCleanup: startNotificationCleanup
};