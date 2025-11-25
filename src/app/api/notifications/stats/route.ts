// src/app/api/notifications/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

/**
 * GET /api/notifications/stats
 * Get notification statistics for admin dashboard
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    await connectDB();

    // If userId is provided, return user-specific stats
    if (userId) {
      // Check if user is requesting their own stats or is admin
      if (!session || (session.user?.id !== userId && session.user?.role !== 'admin')) {
        return NextResponse.json(
          { error: 'ไม่มีสิทธิ์เข้าถึง' },
          { status: 401 }
        );
      }

      const totalNotifications = await Notification.countDocuments({ userId });
      const unreadNotifications = await Notification.countDocuments({ userId, read: false });
      const readNotifications = totalNotifications - unreadNotifications;

      return NextResponse.json({
        success: true,
        data: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: readNotifications
        }
      });
    }

    // Check if user is admin for global stats
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น' },
        { status: 401 }
      );
    }

    // Get total users count
    const totalUsers = await User.countDocuments({ role: 'tenant' });

    // Get total notifications count
    const totalNotifications = await Notification.countDocuments();

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({ read: false });

    // Get read notifications count
    const readNotifications = totalNotifications - unreadNotifications;

    // Get notifications by type
    const notificationsByType = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get notifications sent in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7DaysNotifications = await Notification.countDocuments({
      sentAt: { $gte: sevenDaysAgo }
    });

    // Get notifications sent in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysNotifications = await Notification.countDocuments({
      sentAt: { $gte: thirtyDaysAgo }
    });

    // Get daily notification counts for last 7 days
    const dailyNotifications = await Notification.aggregate([
      {
        $match: {
          sentAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$sentAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get users with most unread notifications
    const usersWithMostUnread = await Notification.aggregate([
      {
        $match: { read: false }
      },
      {
        $group: {
          _id: '$userId',
          unreadCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          unreadCount: 1
        }
      },
      {
        $sort: { unreadCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Calculate average notifications per user
    const avgNotificationsPerUser = totalUsers > 0 ? totalNotifications / totalUsers : 0;

    // Calculate read rate
    const readRate = totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalNotifications,
          unreadNotifications,
          readNotifications,
          avgNotificationsPerUser: Math.round(avgNotificationsPerUser * 100) / 100,
          readRate: Math.round(readRate * 100) / 100
        },
        timeStats: {
          last7DaysNotifications,
          last30DaysNotifications,
          dailyNotifications
        },
        byType: notificationsByType,
        usersWithMostUnread
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}