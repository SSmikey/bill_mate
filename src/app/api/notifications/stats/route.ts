// src/app/api/notifications/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    await connectDB();

    // วันนี้ (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // สัปดาห์นี้
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Query statistics แบบ parallel
    const [
      sentToday,
      sentThisWeek,
      unread,
      totalRead,
      totalNotifications,
      byType,
      recentLogs
    ] = await Promise.all([
      // ส่งวันนี้
      Notification.countDocuments({ sentAt: { $gte: today } }),
      
      // ส่งสัปดาห์นี้
      Notification.countDocuments({ sentAt: { $gte: weekAgo } }),
      
      // ยังไม่อ่าน
      Notification.countDocuments({ read: false }),
      
      // อ่านแล้ว
      Notification.countDocuments({ read: true }),
      
      // ทั้งหมด
      Notification.countDocuments({}),
      
      // แยกตามประเภท
      Notification.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Logs ล่าสุด 10 รายการ
      Notification.find({})
        .sort({ sentAt: -1 })
        .limit(10)
        .select('type sentAt userId read')
        .populate('userId', 'name email')
    ]);

    // คำนวณ read rate
    const readRate = totalNotifications > 0
      ? Math.round((totalRead / totalNotifications) * 100)
      : 0;

    // จัด format ข้อมูลตามประเภท
    const notificationsByType = {
      payment_reminder: 0,
      payment_verified: 0,
      payment_rejected: 0,
      overdue: 0,
      bill_generated: 0
    };

    byType.forEach((item: any) => {
      if (item._id in notificationsByType) {
        notificationsByType[item._id as keyof typeof notificationsByType] = item.count;
      }
    });

    // Cron job status (next run times)
    const now = new Date();
    const nextRuns = calculateNextRuns(now);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          sentToday,
          sentThisWeek,
          unread,
          totalRead,
          totalNotifications,
          readRate
        },
        byType: notificationsByType,
        cronJobs: nextRuns,
        recentLogs: recentLogs.map((log: any) => ({
          id: log._id,
          type: log.type,
          sentAt: log.sentAt,
          read: log.read,
          user: {
            name: log.userId?.name || 'Unknown',
            email: log.userId?.email || 'N/A'
          }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    
    return NextResponse.json(
      { 
        error: 'ไม่สามารถดึงสถิติได้',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// คำนวณเวลาทำงานครั้งถัดไปของแต่ละ cron job
function calculateNextRuns(now: Date) {
  const bangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  
  // Next 5-day reminder (09:00)
  const next5Day = new Date(bangkok);
  next5Day.setHours(9, 0, 0, 0);
  if (next5Day <= bangkok) {
    next5Day.setDate(next5Day.getDate() + 1);
  }
  
  // Next 1-day reminder (18:00)
  const next1Day = new Date(bangkok);
  next1Day.setHours(18, 0, 0, 0);
  if (next1Day <= bangkok) {
    next1Day.setDate(next1Day.getDate() + 1);
  }
  
  // Next overdue check (10:00)
  const nextOverdue = new Date(bangkok);
  nextOverdue.setHours(10, 0, 0, 0);
  if (nextOverdue <= bangkok) {
    nextOverdue.setDate(nextOverdue.getDate() + 1);
  }
  
  // Next cleanup (Sunday 01:00)
  const nextCleanup = new Date(bangkok);
  nextCleanup.setHours(1, 0, 0, 0);
  const daysUntilSunday = (7 - nextCleanup.getDay()) % 7;
  nextCleanup.setDate(nextCleanup.getDate() + (daysUntilSunday || 7));
  
  return [
    {
      name: '5-day payment reminder',
      schedule: 'Daily at 09:00',
      nextRun: next5Day.toISOString(),
      status: 'active'
    },
    {
      name: '1-day payment reminder',
      schedule: 'Daily at 18:00',
      nextRun: next1Day.toISOString(),
      status: 'active'
    },
    {
      name: 'Overdue notifications',
      schedule: 'Daily at 10:00',
      nextRun: nextOverdue.toISOString(),
      status: 'active'
    },
    {
      name: 'Notification cleanup',
      schedule: 'Sunday at 01:00',
      nextRun: nextCleanup.toISOString(),
      status: 'active'
    }
  ];
}