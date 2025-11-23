import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import Room from '@/models/Room';
import { authOptions } from '@/lib/auth';

// GET bills (filtered by role)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let query: any = {};
    if (session.user?.role === 'tenant') {
      query = { tenantId: session.user?.id };
    }

    const bills = await Bill.find(query)
      .populate('roomId', 'roomNumber')
      .populate('tenantId', 'name email')
      .sort({ year: -1, month: -1 });

    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

// POST generate bills for all occupied rooms (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { month, year, dueDay = 5, roomId, tenantId, waterUnits, electricityUnits } = body;
    
    // Check if this is a manual bill creation or automatic generation
    const isManualBill = roomId && tenantId && waterUnits !== undefined && electricityUnits !== undefined;

    // Validation
    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year' },
        { status: 400 }
      );
    }

    await connectDB();

    if (isManualBill) {
      // Manual bill creation for a specific room
      const room = await Room.findById(roomId);
      
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      const waterAmount = waterUnits * room.waterPrice;
      const electricityAmount = electricityUnits * room.electricityPrice;
      const totalAmount = room.rentPrice + waterAmount + electricityAmount;
      const dueDate = new Date(year, month - 1, dueDay);

      try {
        const bill = await Bill.create({
          roomId,
          tenantId,
          month,
          year,
          rentAmount: room.rentPrice,
          waterUnits,
          waterAmount,
          electricityUnits,
          electricityAmount,
          totalAmount,
          dueDate,
          status: 'pending',
        });

        return NextResponse.json(
          {
            success: true,
            data: bill,
            message: 'สร้างบิลใหม่เรียบร้อยแล้ว'
          },
          { status: 201 }
        );
      } catch (error: any) {
        if (error.code === 11000) {
          return NextResponse.json({ error: 'Bill already exists for this room/month/year' }, { status: 400 });
        }
        throw error;
      }
    } else {
      // Automatic bill generation for all occupied rooms
      const rooms = await Room.find({ isOccupied: true }).populate('tenantId');

      if (rooms.length === 0) {
        return NextResponse.json({ error: 'No occupied rooms found' }, { status: 400 });
      }

      const bills = [];
      const dueDate = new Date(year, month - 1, dueDay);

      for (const room of rooms) {
        if (!room.tenantId) continue;

        // For automatic generation, we'll use default values or previous month's consumption
        // For now, we'll use the room's fixed prices as placeholders
        // In a real implementation, you might want to track actual meter readings
        const waterUnits = 0; // Default to 0 for automatic generation
        const electricityUnits = 0; // Default to 0 for automatic generation
        const waterAmount = waterUnits * room.waterPrice;
        const electricityAmount = electricityUnits * room.electricityPrice;
        const totalAmount = room.rentPrice + waterAmount + electricityAmount;

        try {
          const bill = await Bill.create({
            roomId: room._id,
            tenantId: room.tenantId._id,
            month,
            year,
            rentAmount: room.rentPrice,
            waterUnits,
            waterAmount,
            electricityUnits,
            electricityAmount,
            totalAmount,
            dueDate,
            status: 'pending',
          });

          bills.push(bill);
        } catch (error: any) {
          // Skip if duplicate (bill already exists for this room/month/year)
          if (error.code === 11000) continue;
          throw error;
        }
      }

    return NextResponse.json(
      {
        success: true,
        data: bills,
        message: `สร้างบิลเรียบร้อยแล้ว ${bills.length} รายการ`
      },
      { status: 201 }
    );
  }
} catch (error) {
  console.error('Error generating bills:', error);
  return NextResponse.json({ error: 'Failed to generate bills' }, { status: 500 });
}
}
