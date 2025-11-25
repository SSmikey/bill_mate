// src/app/api/notifications/send/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  sendPaymentReminders,
  sendPaymentOverdueNotifications
} from '@/services/notificationService';

/**
 * POST /api/notifications/send
 * Manual trigger สำหรับส่งการแจ้งเตือน (Admin only)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบว่าเป็น admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type } = body;

    console.log(`📧 [MANUAL SEND] Triggered by: ${session.user.email}`);
    console.log(`📧 [MANUAL SEND] Type: ${type}`);
    console.log(`📧 [MANUAL SEND] Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);

    let notificationCount = 0;
    let message = '';

    switch (type) {
      case 'reminder_5days':
        notificationCount = await sendPaymentReminders(5);
        message = `ส่งการแจ้งเตือนก่อนครบกำหนด 5 วัน สำเร็จ ${notificationCount} รายการ`;
        break;

      case 'reminder_1day':
        notificationCount = await sendPaymentReminders(1);
        message = `ส่งการแจ้งเตือนก่อนครบกำหนด 1 วัน สำเร็จ ${notificationCount} รายการ`;
        break;

      case 'overdue':
        notificationCount = await sendPaymentOverdueNotifications();
        message = `ส่งการแจ้งเตือนเกินกำหนดชำระ สำเร็จ ${notificationCount} รายการ`;
        break;

      default:
        return NextResponse.json(
          { error: 'ประเภทการแจ้งเตือนไม่ถูกต้อง' },
          { status: 400 }
        );
    }

    console.log(`✅ [MANUAL SEND] ${message}`);

    return NextResponse.json({
      success: true,
      message,
      data: {
        type,
        notificationCount,
        triggeredBy: session.user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [MANUAL SEND] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/send
 * ดูรายการประเภทการแจ้งเตือนที่สามารถส่งได้
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        availableTypes: [
          {
            type: 'reminder_5days',
            name: 'เตือนก่อนครบกำหนด 5 วัน',
            description: 'ส่งการแจ้งเตือนไปยังผู้ที่มีบิลครบกำหนดใน 5 วัน',
            icon: '🔔'
          },
          {
            type: 'reminder_1day',
            name: 'เตือนก่อนครบกำหนด 1 วัน',
            description: 'ส่งการแจ้งเตือนไปยังผู้ที่มีบิลครบกำหนดพรุ่งนี้',
            icon: '⏰'
          },
          {
            type: 'overdue',
            name: 'แจ้งเตือนเกินกำหนด',
            description: 'ส่งการแจ้งเตือนไปยังผู้ที่ค้างชำระ',
            icon: '⚠️'
          }
        ]
      }
    });

  } catch (error) {
    console.error('Error fetching notification types:', error);
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}