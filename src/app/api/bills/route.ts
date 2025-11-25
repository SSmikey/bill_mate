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

// POST create a new bill (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roomId, tenantId, month, year, waterUnits, electricityUnits, dueDay = 5 } = body;

    // Validation
    if (!roomId || !tenantId || !month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid data provided' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get room details
    const room = await Room.findById(roomId);

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Calculate amounts
    const waterAmount = room.waterPrice;
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
        waterUnits: waterUnits || 0,
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
  } catch (error) {
    console.error('Error creating bill:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
