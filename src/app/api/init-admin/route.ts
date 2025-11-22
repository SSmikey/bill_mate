import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// POST create initial admin user (no authentication required for setup)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลที่จำเป็น: email, password, name' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json({ 
        error: 'Admin user already exists. Cannot create multiple admins through this endpoint.' 
      }, { status: 400 });
    }

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
      role: 'admin',
    });

    const userObject = user.toObject();
    const { password: _, ...userResponse } = userObject;

    return NextResponse.json({ 
      success: true, 
      data: userResponse,
      message: 'Admin user created successfully!'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}