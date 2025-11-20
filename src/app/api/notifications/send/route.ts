import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPaymentReminders, sendPaymentOverdueNotifications } from '@/services/notificationService';

// POST send notifications (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type = 'reminder', daysBefore = 5 } = body;

    let notificationCount = 0;

    if (type === 'reminder_5days') {
      notificationCount = await sendPaymentReminders(5);
    } else if (type === 'reminder_1day') {
      notificationCount = await sendPaymentReminders(1);
    } else if (type === 'overdue') {
      notificationCount = await sendPaymentOverdueNotifications();
    } else {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        notificationCount,
        type,
        timestamp: new Date()
      },
      message: `ส่งการแจ้งเตือนเรียบร้อยแล้ว ${notificationCount} รายการ`
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

// GET notification status (for debugging)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        notificationTypes: [
          { type: 'reminder_5days', description: 'แจ้งเตือน 5 วันก่อนครบกำหนด' },
          { type: 'reminder_1day', description: 'แจ้งเตือน 1 วันก่อนครบกำหนด' },
          { type: 'overdue', description: 'แจ้งเตือนการชำระเงินเกินกำหนด' }
        ],
        instructions: 'ใช้ POST กับ type ที่ต้องการ เช่น { "type": "reminder_5days" }'
      }
    });
  } catch (error) {
    console.error('Error getting notification status:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
