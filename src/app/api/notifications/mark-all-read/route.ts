import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { handleApiError } from '@/lib/errorHandling';
import logger from '@/lib/logger';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    
    // Only allow users to mark their own notifications as read
    // or admins to mark any user's notifications as read
    if (userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' },
        { status: 403 }
      );
    }

    await connectToDatabase();
    
    const result = await Notification.updateMany(
      { 
        userId: userId || session.user.id,
        read: false 
      },
      { 
        $set: { read: true } 
      }
    );

    logger.info('Marked all notifications as read', 'API', {
      userId: userId || session.user.id,
      modifiedCount: result.modifiedCount,
      apiRoute: '/api/notifications/mark-all-read'
    });

    return NextResponse.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    logger.error('Failed to mark all notifications as read', error instanceof Error ? error : new Error(String(error)), 'API', {
      apiRoute: '/api/notifications/mark-all-read'
    });

    return handleApiError(error);
  }
}