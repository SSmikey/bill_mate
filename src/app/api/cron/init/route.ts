// src/app/api/cron/init/route.ts
import { NextResponse } from 'next/server';
import { initializeCronJobs } from '@/services/cronService';

// Flag เพื่อป้องกันการ initialize ซ้ำ
let cronJobsInitialized = false;

export async function GET() {
  try {
    if (!cronJobsInitialized) {
      initializeCronJobs();
      cronJobsInitialized = true;
      
      return NextResponse.json({
        success: true,
        message: 'Cron jobs initialized successfully',
        timestamp: new Date().toISOString(),
        jobs: [
          {
            name: '5-day payment reminder',
            schedule: '09:00 daily',
            description: 'ส่งแจ้งเตือนก่อนครบกำหนด 5 วัน'
          },
          {
            name: '1-day payment reminder',
            schedule: '18:00 daily',
            description: 'ส่งแจ้งเตือนก่อนครบกำหนด 1 วัน'
          },
          {
            name: 'Overdue notifications',
            schedule: '10:00 daily',
            description: 'ส่งแจ้งเตือนเมื่อเกินกำหนดชำระ'
          },
          {
            name: 'Notification cleanup',
            schedule: '01:00 every Sunday',
            description: 'ลบ notifications เก่ากว่า 30 วัน'
          }
        ]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Cron jobs are already running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing cron jobs:', error);
    
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

// Health check endpoint
export async function POST() {
  return NextResponse.json({
    success: true,
    status: cronJobsInitialized ? 'running' : 'not initialized',
    timestamp: new Date().toISOString()
  });
}