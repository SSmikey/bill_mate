// src/app/api/maintenance/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Maintenance from '@/models/Maintenance';
import Room from '@/models/Room';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // 1. Overall maintenance statistics
    const overallStats = await Maintenance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalCost: { $sum: '$cost' },
          avgCost: { $avg: '$cost' }
        }
      }
    ]);

    // 2. Maintenance by category
    const categoryStats = await Maintenance.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgCost: { $avg: '$cost' },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 3. Maintenance by priority
    const priorityStats = await Maintenance.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgCost: { $avg: '$cost' },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 4. Monthly maintenance trends (last 12 months)
    const monthlyTrends = await Maintenance.aggregate([
      {
        $group: {
          _id: { year: { $year: '$reportedDate' }, month: { $month: '$reportedDate' } },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // 5. Average completion time analysis
    const completionTimeAnalysis = await Maintenance.aggregate([
      { $match: { status: 'completed', completedDate: { $exists: true } } },
      {
        $project: {
          category: 1,
          priority: 1,
          completionDays: {
            $divide: [
              { $subtract: ['$completedDate', '$reportedDate'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionDays: { $avg: '$completionDays' },
          minCompletionDays: { $min: '$completionDays' },
          maxCompletionDays: { $max: '$completionDays' }
        }
      }
    ]);

    // 6. Completion time by category
    const completionTimeByCategory = await Maintenance.aggregate([
      { $match: { status: 'completed', completedDate: { $exists: true } } },
      {
        $project: {
          category: 1,
          completionDays: {
            $divide: [
              { $subtract: ['$completedDate', '$reportedDate'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: '$category',
          avgCompletionDays: { $avg: '$completionDays' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgCompletionDays: 1 } }
    ]);

    // 7. Room with most maintenance requests
    const roomMaintenanceStats = await Maintenance.aggregate([
      {
        $group: {
          _id: '$roomId',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $project: {
          roomId: '$_id',
          roomNumber: '$room.roomNumber',
          floor: '$room.floor',
          count: 1,
          totalCost: 1,
          completedCount: 1
        }
      }
    ]);

    // 8. Urgent pending requests
    const urgentPending = await Maintenance.find({
      status: { $in: ['pending', 'in-progress'] },
      priority: 'urgent'
    })
      .populate('roomId', 'roomNumber floor')
      .populate('tenantId', 'name email')
      .sort({ reportedDate: 1 })
      .limit(10)
      .lean();

    // 9. Cost trends over time
    const costTrends = await Maintenance.aggregate([
      { $match: { cost: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: { year: { $year: '$reportedDate' }, month: { $month: '$reportedDate' } },
          totalCost: { $sum: '$cost' },
          avgCost: { $avg: '$cost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overallStats: overallStats[0] || {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          cancelled: 0,
          totalCost: 0,
          avgCost: 0
        },
        categoryStats,
        priorityStats,
        monthlyTrends,
        completionTimeAnalysis: completionTimeAnalysis[0] || {
          avgCompletionDays: 0,
          minCompletionDays: 0,
          maxCompletionDays: 0
        },
        completionTimeByCategory,
        roomMaintenanceStats,
        urgentPending,
        costTrends
      },
    });

  } catch (error) {
    console.error('Maintenance Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}