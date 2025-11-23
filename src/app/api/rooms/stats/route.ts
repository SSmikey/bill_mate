import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const roomsCollection = db.collection('rooms');
    const billsCollection = db.collection('bills');

    // Build date filter for bills
    let billDateFilter: any = {};

    if (period === 'month' && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      billDateFilter = {
        billingDate: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else if (period === 'year') {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      billDateFilter = {
        billingDate: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // 1. Basic room statistics
    const totalRooms = await roomsCollection.countDocuments();
    const occupiedRooms = await roomsCollection.countDocuments({ isOccupied: true });
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(2) : '0';

    // 2. Revenue statistics
    const revenueStats = await billsCollection
      .aggregate([
        { $match: { ...billDateFilter, status: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const billCount = revenueStats.length > 0 ? revenueStats[0].count : 0;

    // 3. Revenue by room
    const revenueByRoom = await billsCollection
      .aggregate([
        { $match: { ...billDateFilter, status: 'paid' } },
        {
          $group: {
            _id: '$roomId',
            revenue: { $sum: '$totalAmount' },
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
      ])
      .toArray();

    // 4. Price range statistics
    const priceRangeStats = await roomsCollection
      .aggregate([
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
      ])
      .toArray();

    const priceStats = priceRangeStats.length > 0 ? priceRangeStats[0] : {
      avgRent: 0,
      minRent: 0,
      maxRent: 0,
      avgWater: 0,
      avgElectricity: 0,
    };

    // 5. Rooms by floor
    const roomsByFloor = await roomsCollection
      .aggregate([
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
      ])
      .toArray();

    // 6. Monthly occupancy trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const occupancyTrend = await billsCollection
      .aggregate([
        {
          $match: {
            billingDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$billingDate' },
              month: { $month: '$billingDate' },
            },
            occupiedCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ])
      .toArray();

    // 7. Average rental period
    const rentalPeriods = await roomsCollection
      .aggregate([
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
      ])
      .toArray();

    const avgRentalPeriod = rentalPeriods.length > 0 ? Math.round(rentalPeriods[0].avgDays) : 0;

    // 8. Payment status overview
    const paymentStats = await billsCollection
      .aggregate([
        { $match: billDateFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$totalAmount' },
          },
        },
      ])
      .toArray();

    const paymentOverview: Record<string, any> = {};
    paymentStats.forEach((stat) => {
      paymentOverview[stat._id] = {
        count: stat.count,
        amount: stat.amount,
      };
    });

    // 9. Top revenue rooms (all time)
    const topRevenueRooms = await billsCollection
      .aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: '$roomId',
            totalRevenue: { $sum: '$totalAmount' },
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
      ])
      .toArray();

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