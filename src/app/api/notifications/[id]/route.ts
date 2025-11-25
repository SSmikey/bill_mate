// src/app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/notifications/[id]
 * ดูรายละเอียด notification แบบเจาะจง
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    await connectDB();

    const notification = await Notification.findById(id)
      .populate('userId', 'name email role')
      .populate({
        path: 'billId',
        select: 'roomId month year totalAmount dueDate status',
        populate: {
          path: 'roomId',
          select: 'roomNumber floor'
        }
      });

    if (!notification) {
      return NextResponse.json(
        { error: 'ไม่พบการแจ้งเตือนนี้' },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์ - ต้องเป็นเจ้าของหรือ admin
    const isOwner = notification.userId._id.toString() === session.user?.id;
    const isAdmin = session.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์เข้าถึงการแจ้งเตือนนี้' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/[id]
 * อัพเดทสถานะ notification (เช่น mark as read)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { read } = body;

    await connectDB();

    // หา notification
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { error: 'ไม่พบการแจ้งเตือนนี้' },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์
    if (notification.userId.toString() !== session.user?.id) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์แก้ไขการแจ้งเตือนนี้' },
        { status: 403 }
      );
    }

    // อัพเดทสถานะ
    if (typeof read === 'boolean') {
      notification.read = read;
      
      // ถ้า mark as read ให้บันทึกเวลา
      if (read && !notification.readAt) {
        notification.readAt = new Date();
      }
      
      // ถ้า mark as unread ให้ลบเวลา
      if (!read) {
        notification.readAt = undefined;
      }
    }

    await notification.save();

    return NextResponse.json({
      success: true,
      message: read ? 'ทำเครื่องหมายว่าอ่านแล้ว' : 'ทำเครื่องหมายว่ายังไม่อ่าน',
      data: { notification }
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการอัพเดท',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * ลบ notification
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    await connectDB();

    // หา notification และตรวจสอบว่ามีอยู่จริง
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { error: 'ไม่พบการแจ้งเตือนนี้' },
        { status: 404 }
      );
    }

    // ตรวจสอบสิทธิ์ - ต้องเป็นเจ้าของหรือ admin
    const isOwner = notification.userId.toString() === session.user?.id;
    const isAdmin = session.user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'คุณไม่มีสิทธิ์ลบการแจ้งเตือนนี้' },
        { status: 403 }
      );
    }

    // ลบ notification
    await Notification.findByIdAndDelete(id);

    console.log(`🗑️ Notification deleted: ${id} by ${session.user?.email}`);

    return NextResponse.json({
      success: true,
      message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}