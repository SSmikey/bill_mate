import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCronJobStatus, getNextRunTimes } from '@/services/cronService';
import { handleApiError } from '@/lib/errorHandling';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    // Only admins can check cron job status
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' },
        { status: 403 }
      );
    }

    const jobStatus = getCronJobStatus();
    const nextRunTimes = getNextRunTimes();

    logger.info('Cron job status requested', 'API', {
      userId: session.user.id,
      jobStatus
    });

    return NextResponse.json({
      success: true,
      data: {
        jobStatus,
        nextRunTimes,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get cron job status', error instanceof Error ? error : new Error(String(error)), 'API');
    return handleApiError(error);
  }
}