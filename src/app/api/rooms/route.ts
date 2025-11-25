import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import { authOptions } from '@/lib/auth';

// GET all rooms
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const rooms = await Room.find().populate('tenantId', 'name email phone');

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST create room (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { roomNumber, floor, rentPrice, waterPrice, electricityPrice } = body;

    // Validation
    if (!roomNumber || rentPrice === undefined || waterPrice === undefined || electricityPrice === undefined) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น: roomNumber, rentPrice, waterPrice, electricityPrice' },
        { status: 400 }
      );
    }

    await connectDB();

    const room = await Room.create({
      roomNumber,
      floor: floor || null,
      rentPrice: parseFloat(rentPrice),
      waterPrice: parseFloat(waterPrice),
      electricityPrice: parseFloat(electricityPrice),
      isOccupied: false,
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'เลขห้องนี้มีอยู่แล้ว' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
