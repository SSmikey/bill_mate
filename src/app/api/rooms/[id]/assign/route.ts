import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Room from '@/models/Room';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { handleApiError } from '@/lib/errorHandling';
import logger from '@/lib/logger';
import { Types } from 'mongoose';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'รหัสห้องไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Handle form data (for file upload)
    const formData = await request.formData();
    const tenantId = formData.get('tenantId') as string;
    const moveInDate = formData.get('moveInDate') as string;
    const rentDueDate = parseInt(formData.get('rentDueDate') as string);
    const depositAmount = parseFloat(formData.get('depositAmount') as string);
    const notes = formData.get('notes') as string;
    const rentalAgreement = formData.get('rentalAgreement') as File | null;

    // Validation
    if (!tenantId) {
      return NextResponse.json(
        { error: 'กรุณาระบุผู้เช่า' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(tenantId)) {
      return NextResponse.json(
        { error: 'รหัสผู้เช่าไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (!moveInDate) {
      return NextResponse.json(
        { error: 'กรุณาระบุวันที่เข้าพัก' },
        { status: 400 }
      );
    }

    if (!rentDueDate || rentDueDate < 1 || rentDueDate > 31) {
      return NextResponse.json(
        { error: 'วันที่ครบกำหนดต้องอยู่ระหว่าง 1-31' },
        { status: 400 }
      );
    }

    if (depositAmount === undefined || depositAmount < 0) {
      return NextResponse.json(
        { error: 'จำนวนเงินมัดจำไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    // Only admins can assign rooms
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if room exists and is available
    const room = await Room.findById(id);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบห้องที่ระบุ' },
        { status: 404 }
      );
    }

    if (room.isOccupied) {
      return NextResponse.json(
        { success: false, error: 'ห้องนี้มีผู้เช่าอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Check if tenant exists and is available
    const tenant = await User.findById(tenantId);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้เช่าที่ระบุ' },
        { status: 404 }
      );
    }

    if (tenant.role !== 'tenant') {
      return NextResponse.json(
        { success: false, error: 'ผู้ใช้งานนี้ไม่ใช่ผู้เช่า' },
        { status: 400 }
      );
    }

    if (tenant.roomId) {
      return NextResponse.json(
        { success: false, error: 'ผู้เช่านี้มีห้องอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Handle rental agreement upload
    let rentalAgreementPath = '';
    if (rentalAgreement) {
      // Validate file size (5MB max)
      if (rentalAgreement.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'ขนาดไฟล์สัญญาเช่าต้องไม่เกิน 5MB' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(rentalAgreement.type)) {
        return NextResponse.json(
          { error: 'ประเภทไฟล์สัญญาเช่าไม่รองรับ กรุณาอัปโหลด PDF, JPG หรือ PNG' },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'rental-agreements');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = rentalAgreement.name.split('.').pop();
      const filename = `room_${id}_${tenantId}_${timestamp}.${fileExtension}`;
      const filepath = path.join(uploadsDir, filename);

      // Write file
      const buffer = Buffer.from(await rentalAgreement.arrayBuffer());
      await writeFile(filepath, buffer);

      // Store relative path for database
      rentalAgreementPath = `/uploads/rental-agreements/${filename}`;
    }

    // Start transaction-like operations
    const now = new Date();

    // Update room
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      {
        isOccupied: true,
        tenantId: tenantId,
        moveInDate: new Date(moveInDate),
        rentDueDate: rentDueDate,
        depositAmount: depositAmount,
        assignmentNotes: notes || '',
        rentalAgreement: rentalAgreementPath,
        updatedAt: now,
      },
      { new: true }
    ).populate('tenantId');

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถอัปเดตห้องได้' },
        { status: 500 }
      );
    }

    // Update tenant
    const updatedTenant = await User.findByIdAndUpdate(
      tenantId,
      {
        roomId: id,
        moveInDate: new Date(moveInDate),
        rentDueDate: rentDueDate,
        depositAmount: depositAmount,
        updatedAt: now,
      },
      { new: true }
    );

    if (!updatedTenant) {
      // Rollback room update
      await Room.findByIdAndUpdate(id, {
        isOccupied: false,
        updatedAt: now,
      });

      return NextResponse.json(
        { success: false, error: 'ไม่สามารถอัปเดตข้อมูลผู้เช่าได้' },
        { status: 500 }
      );
    }

    logger.info('Room assigned successfully', 'API', {
      roomId: id,
      tenantId,
      assignedBy: session.user?.id
    });

    return NextResponse.json(
      {
        success: true,
        message: 'มอบหมายห้องสำเร็จ',
        data: updatedRoom,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error assigning room:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการมอบหมายห้อง: ' + error.message },
      { status: 500 }
    );
  }
}

// Endpoint for checkout (unassign)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'รหัสห้องไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    // Only admins can unassign rooms
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' },
        { status: 403 }
      );
    }

    await connectDB();

    // Find room
    const room = await Room.findById(id);

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบห้องที่ระบุ' },
        { status: 404 }
      );
    }

    if (!room.isOccupied || !room.tenantId) {
      return NextResponse.json(
        { success: false, error: 'ห้องนี้ไม่มีผู้เช่าอยู่' },
        { status: 400 }
      );
    }

    const now = new Date();
    const tenantId = room.tenantId;

    // Update room (checkout)
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      {
        isOccupied: false,
        tenantId: null,
        moveOutDate: now,
        updatedAt: now,
      },
      { new: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถอัปเดตห้องได้' },
        { status: 500 }
      );
    }

    // Update tenant
    const updatedTenant = await User.findByIdAndUpdate(
      tenantId,
      {
        roomId: null,
        moveOutDate: now,
        updatedAt: now,
      },
      { new: true }
    );

    if (!updatedTenant) {
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถอัปเดตข้อมูลผู้เช่าได้' },
        { status: 500 }
      );
    }

    logger.info('Room unassigned successfully', 'API', {
      roomId: id,
      tenantId,
      unassignedBy: session.user?.id
    });

    return NextResponse.json(
      {
        success: true,
        message: 'ปลดผู้เช่าออกจากห้องสำเร็จ',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Room unassignment failed', error instanceof Error ? error : new Error(String(error)), 'API');
    return handleApiError(error);
  }
}