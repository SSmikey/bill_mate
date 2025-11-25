// src/app/api/cron/init/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { initializeCronJobs, getCronJobStatus, getNextRunTimes } from '@/services/cronService';
import logger from '@/lib/logger';

// Flag เพื่อป้องกันการ initialize ซ้ำ
let cronJobsInitialized = false;

/**
 * GET /api/cron/init
 * Initialize all cron jobs (Admin only)
 */
export async function GET() {
  try {
    // ตรวจสอบว่าเป็น admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Admin access required' 
        },
        { status: 401 }
      );
    }

    // ถ้ายัง initialize ให้ทำการ initialize
    if (!cronJobsInitialized) {
      try {
        initializeCronJobs();
        cronJobsInitialized = true;
        
        logger.info('Cron jobs initialized via API', 'CronAPI');
        
        return NextResponse.json({
          success: true,
          message: 'Cron jobs initialized successfully',
          timestamp: new Date().toISOString(),
          timezone: 'Asia/Bangkok',
          jobs: [
            {
              name: '5-day payment reminder',
              schedule: '0 9 * * *',
              time: '09:00 daily',
              description: 'ส่งแจ้งเตือนก่อนครบกำหนด 5 วัน'
            },
            {
              name: '1-day payment reminder',
              schedule: '0 18 * * *',
              time: '18:00 daily',
              description: 'ส่งแจ้งเตือนก่อนครบกำหนด 1 วัน'
            },
            {
              name: 'Overdue notifications',
              schedule: '0 10 * * *',
              time: '10:00 daily',
              description: 'ส่งแจ้งเตือนเมื่อเกินกำหนดชำระ'
            },
            {
              name: 'Notification cleanup',
              schedule: '0 1 * * 0',
              time: '01:00 every Sunday',
              description: 'ลบ notifications ที่อ่านแล้วและเก่ากว่า 30 วัน'
            }
          ]
        });
      } catch (error) {
        logger.error('Failed to initialize cron jobs via API', error as Error, 'CronAPI');
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to initialize cron jobs',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // ถ้า initialize แล้ว
    return NextResponse.json({
      success: true,
      message: 'Cron jobs are already running',
      timestamp: new Date().toISOString(),
      status: 'active'
    });

  } catch (error) {
    logger.error('Error in cron init API', error as Error, 'CronAPI');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize cron jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/init
 * Health check และ status endpoint
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Admin access required' 
        },
        { status: 401 }
      );
    }

    const now = new Date();
    const bangkokTime = now.toLocaleString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    return NextResponse.json({
      success: true,
      status: cronJobsInitialized ? 'running' : 'not initialized',
      initialized: cronJobsInitialized,
      timestamp: now.toISOString(),
      bangkokTime,
      uptime: process.uptime(),
      message: cronJobsInitialized 
        ? 'All cron jobs are running normally' 
        : 'Cron jobs have not been initialized yet'
    });

  } catch (error) {
    logger.error('Error checking cron status', error as Error, 'CronAPI');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check cron status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cron/init
 * Stop all cron jobs (สำหรับ development/testing)
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Admin access required' 
        },
        { status: 401 }
      );
    }

    // Reset flag
    cronJobsInitialized = false;

    return NextResponse.json({
      success: true,
      message: 'Cron jobs stopped (flag reset)',
      timestamp: new Date().toISOString(),
      note: 'Server restart required to fully stop node-cron schedules'
    });

  } catch (error) {
    logger.error('Error stopping cron jobs', error as Error, 'CronAPI');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to stop cron jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}