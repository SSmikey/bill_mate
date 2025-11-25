import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get total revenue from verified bills
    const verifiedBills = await Bill.find({ status: 'verified' });
    const totalRevenue = verifiedBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    // Get payment statistics from bills
    const allBills = await Bill.find({});
    const paymentStats = {
      pending: allBills.filter(b => b.status === 'paid').length,
      verified: allBills.filter(b => b.status === 'verified').length,
      rejected: allBills.filter(b => b.status === 'overdue').length,
    };

    // Get monthly revenue for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Bill.aggregate([
      {
        $match: {
          status: 'verified',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        paymentStats,
        monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
