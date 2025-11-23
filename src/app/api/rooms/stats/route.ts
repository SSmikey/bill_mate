import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import Bill from '@/models/Bill';
import Payment from '@/models/Payment';

/**
 * GET /api/rooms/stats
 * ดึงสถิติของห้องพักทั้งหมด
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, month, year
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month'); // 1-12

    await connectDB();

    // Build date filter for bills
    let billDateFilter: any = {};

    if (period === 'month' && month) {
      billDateFilter = {
        month: parseInt(month),
        year: parseInt(year),
      };
    } else if (period === 'year') {
      billDateFilter = {
        year: parseInt(year),
      };
    }

    // 1. Basic room statistics
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ isOccupied: true });
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : '0';

    // 2. Revenue statistics based on verified payments
    let paymentMatchStage: any = { status: 'verified' };
    
    const revenueStats = await Payment.aggregate([
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'billInfo',
        },
      },
      { $unwind: '$billInfo' },
      { $match: paymentMatchStage },
      ...(Object.keys(billDateFilter).length > 0 ? [{
        $match: Object.entries(billDateFilter).reduce((acc, [key, value]) => {
          acc[`billInfo.${key}`] = value;
          return acc;
        }, {} as any)
      }] : []),
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$billInfo.totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const billCount = revenueStats.length > 0 ? revenueStats[0].count : 0;

    // 3. Revenue by room based on verified payments
    const revenueByRoom = await Payment.aggregate([
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'billInfo',
        },
      },
      { $unwind: '$billInfo' },
      { $match: paymentMatchStage },
      ...(Object.keys(billDateFilter).length > 0 ? [{
        $match: Object.entries(billDateFilter).reduce((acc, [key, value]) => {
          acc[`billInfo.${key}`] = value;
          return acc;
        }, {} as any)
      }] : []),
      {
        $group: {
          _id: '$billInfo.roomId',
          revenue: { $sum: '$billInfo.totalAmount' },
          billCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'roomInfo',
        },
      },
      { $unwind: '$roomInfo' },
      {
        $project: {
          roomNumber: '$roomInfo.roomNumber',
          floor: '$roomInfo.floor',
          revenue: 1,
          billCount: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // 4. Price range statistics
    const priceRangeStats = await Room.aggregate([
      {
        $group: {
          _id: null,
          avgRent: { $avg: '$rentPrice' },
          minRent: { $min: '$rentPrice' },
          maxRent: { $max: '$rentPrice' },
          avgWater: { $avg: '$waterPrice' },
          avgElectricity: { $avg: '$electricityPrice' },
        },
      },
    ]);

    const priceStats = priceRangeStats.length > 0 ? priceRangeStats[0] : {
      avgRent: 0,
      minRent: 0,
      maxRent: 0,
      avgWater: 0,
      avgElectricity: 0,
    };

    // 5. Rooms by floor
    const roomsByFloor = await Room.aggregate([
      {
        $group: {
          _id: '$floor',
          total: { $sum: 1 },
          occupied: {
            $sum: {
              $cond: ['$isOccupied', 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 6. Monthly occupancy trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const occupancyTrend = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          occupiedCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 7. Average rental period
    const rentalPeriods = await Room.aggregate([
      {
        $match: {
          isOccupied: true,
          moveInDate: { $exists: true },
        },
      },
      {
        $project: {
          daysSinceMoveIn: {
            $divide: [
              { $subtract: [new Date(), '$moveInDate'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$daysSinceMoveIn' },
        },
      },
    ]);

    const avgRentalPeriod = rentalPeriods.length > 0 ? Math.round(rentalPeriods[0].avgDays) : 0;

    // 8. Payment status overview
    const paymentStats = await Bill.aggregate([
      { $match: billDateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const paymentOverview: Record<string, any> = {};
    paymentStats.forEach((stat) => {
      paymentOverview[stat._id] = {
        count: stat.count,
        amount: stat.amount,
      };
    });

    // 9. Top revenue rooms (all time) based on verified payments
    const topRevenueRooms = await Payment.aggregate([
      { $match: { status: 'verified' } },
      {
        $lookup: {
          from: 'bills',
          localField: 'billId',
          foreignField: '_id',
          as: 'billInfo',
        },
      },
      { $unwind: '$billInfo' },
      {
        $group: {
          _id: '$billInfo.roomId',
          totalRevenue: { $sum: '$billInfo.totalAmount' },
          billCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'roomInfo',
        },
      },
      { $unwind: '$roomInfo' },
      {
        $project: {
          roomNumber: '$roomInfo.roomNumber',
          floor: '$roomInfo.floor',
          totalRevenue: 1,
          billCount: 1,
          avgRevenue: { $divide: ['$totalRevenue', '$billCount'] },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // Compile all statistics
    const stats = {
      overview: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate: parseFloat(occupancyRate),
      },
      revenue: {
        total: totalRevenue,
        billCount,
        avgPerBill: billCount > 0 ? totalRevenue / billCount : 0,
        byRoom: revenueByRoom,
      },
      pricing: {
        avgRent: Math.round(priceStats.avgRent),
        minRent: priceStats.minRent,
        maxRent: priceStats.maxRent,
        avgWater: Math.round(priceStats.avgWater),
        avgElectricity: parseFloat(priceStats.avgElectricity.toFixed(2)),
      },
      floors: roomsByFloor.map((floor) => ({
        floor: floor._id || 'ไม่ระบุ',
        total: floor.total,
        occupied: floor.occupied,
        available: floor.total - floor.occupied,
        occupancyRate: ((floor.occupied / floor.total) * 100).toFixed(2),
      })),
      trends: {
        occupancy: occupancyTrend.map((trend) => ({
          year: trend._id.year,
          month: trend._id.month,
          occupiedCount: trend.occupiedCount,
        })),
      },
      rental: {
        avgRentalPeriodDays: avgRentalPeriod,
        avgRentalPeriodMonths: (avgRentalPeriod / 30).toFixed(1),
      },
      payments: paymentOverview,
      topRooms: topRevenueRooms,
    };

    return NextResponse.json(
      {
        success: true,
        data: stats,
        filters: {
          period,
          year,
          month,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching room statistics:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงสถิติ: ' + error.message },
      { status: 500 }
    );
  }
}