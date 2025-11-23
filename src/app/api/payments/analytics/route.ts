// src/app/api/payments/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';

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
      { $group: { _id: null, total: { $sum: '$billId.totalAmount' } } } // Assuming we need to sum the bill amount
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

    // 3. Monthly revenue for the last 12 months (example)
    const monthlyRevenue = await Payment.aggregate([
        { $match: { status: 'verified' } },
        {
            $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                revenue: { $sum: "$billId.totalAmount" }
            }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        paymentStats,
        monthlyRevenue,
      },
    });

  } catch (error) {
    console.error('Payment Analytics API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}