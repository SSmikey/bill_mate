// src/app/api/payments/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Bill from '@/models/Bill';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    // 1. Calculate total revenue from verified payments
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'verified' } },
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'bill'
        }
      },
      { $unwind: '$bill' },
      { $group: { _id: null, total: { $sum: '$bill.totalAmount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // 2. Count payments by status
    const statusCounts = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const paymentStats = {
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      verified: statusCounts.find(s => s._id === 'verified')?.count || 0,
      rejected: statusCounts.find(s => s._id === 'rejected')?.count || 0,
    };

    // 3. Monthly revenue for the last 12 months
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'verified' } },
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'bill'
        }
      },
      { $unwind: '$bill' },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$bill.totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    // 4. Payment method statistics (from OCR data)
    const paymentMethods = await Payment.aggregate([
      { $match: { status: 'verified', 'ocrData.fromAccount': { $exists: true } } },
      {
        $group: {
          _id: '$ocrData.fromAccount',
          count: { $sum: 1 },
          totalAmount: { $sum: '$ocrData.amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 5. Late payment analysis
    const latePayments = await Payment.aggregate([
      { $match: { status: 'verified' } },
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'bill'
        }
      },
      { $unwind: '$bill' },
      {
        $project: {
          billId: 1,
          userId: 1,
          createdAt: 1,
          verifiedAt: 1,
          dueDate: '$bill.dueDate',
          totalAmount: '$bill.totalAmount',
          daysLate: {
            $divide: [
              { $subtract: ['$createdAt', '$bill.dueDate'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      { $match: { daysLate: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgDaysLate: { $avg: '$daysLate' },
          maxDaysLate: { $max: '$daysLate' },
          totalLatePayments: { $sum: 1 },
          totalLateAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // 6. Payment trends by month (comparison)
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const paymentTrends = await Payment.aggregate([
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'bill'
        }
      },
      { $unwind: '$bill' },
      {
        $project: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          status: 1,
          amount: '$bill.totalAmount'
        }
      },
      { $match: { year: { $in: [currentYear, lastYear] } } },
      {
        $group: {
          _id: { year: '$year', month: '$month', status: '$status' },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': 1 } }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        paymentStats,
        monthlyRevenue,
        paymentMethods,
        latePayments: latePayments[0] || {
          avgDaysLate: 0,
          maxDaysLate: 0,
          totalLatePayments: 0,
          totalLateAmount: 0
        },
        paymentTrends
      },
    });

  } catch (error) {
    console.error('Payment Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}