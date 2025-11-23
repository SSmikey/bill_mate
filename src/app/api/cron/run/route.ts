import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runJobManually } from '@/services/cronService';
import { handleApiError } from '@/lib/errorHandling';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    // Only admins can run cron jobs manually
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' },
        { status: 403 }
      );
    }

    const { jobName } = await request.json();

    if (!jobName) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่องาน' },
        { status: 400 }
      );
    }

    const validJobs = [
      'payment-reminder-5-days',
      'payment-reminder-1-day',
      'overdue-notifications',
      'monthly-bill-generation',
      'notification-cleanup'
    ];

    if (!validJobs.includes(jobName)) {
      return NextResponse.json(
        { success: false, error: 'ชื่องานไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    logger.info(`Manual cron job execution requested: ${jobName}`, 'API', {
      userId: session.user.id,
      jobName
    });

    await runJobManually(jobName);

    logger.info(`Manual cron job completed: ${jobName}`, 'API', {
      userId: session.user.id,
      jobName
    });

    return NextResponse.json({
      success: true,
      message: `รันงาน ${jobName} เรียบร้อยแล้ว`,
      data: {
        jobName,
        executedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to run manual cron job', error instanceof Error ? error : new Error(String(error)), 'API');
    return handleApiError(error);
  }
}