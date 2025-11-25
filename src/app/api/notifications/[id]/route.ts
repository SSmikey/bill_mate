// src/app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

// DELETE /api/notifications/:id
// ลบ notification (เฉพาะเจ้าของ)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // ตรวจสอบ authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    await connectDB();

    // ค้นหา notification และตรวจสอบเจ้าของ
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าเป็นเจ้าของ notification นี้หรือไม่
    if (notification.userId.toString() !== session.user?.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own notifications' },
        { status: 403 }
      );
    }

    // ลบ notification
    await Notification.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('❌ [API] Error deleting notification:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET /api/notifications/:id
// ดูรายละเอียด notification เดียว
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const notification = await Notification.findById(id)
      .populate('billId', 'roomId month year totalAmount status')
      .lean();

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // ตรวจสอบเจ้าของ
    if (notification.userId.toString() !== session.user?.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('❌ [API] Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}