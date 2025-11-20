import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcryptjs from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// GET all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const users = await User.find().select('-password').populate('roomId');

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, role = 'tenant', roomId } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น: email, password, name' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 400 });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || null,
      role,
      roomId: roomId || null,
    });

    const userObject = user.toObject();
    const { password: _, ...userResponse } = userObject;

    return NextResponse.json({ success: true, data: userResponse }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
