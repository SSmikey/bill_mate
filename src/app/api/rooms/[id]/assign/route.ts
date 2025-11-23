import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'รหัสห้องไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tenantId, moveInDate, rentDueDate, depositAmount, notes } = body;

    // Validation
    if (!tenantId) {
      return NextResponse.json(
        { error: 'กรุณาระบุผู้เช่า' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(tenantId)) {
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

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const roomsCollection = db.collection('rooms');
    const usersCollection = db.collection('users');

    // Check if room exists and is available
    const room = await roomsCollection.findOne({ _id: new ObjectId(id) });

    if (!room) {
      return NextResponse.json(
        { error: 'ไม่พบห้องที่ระบุ' },
        { status: 404 }
      );
    }

    if (room.isOccupied) {
      return NextResponse.json(
        { error: 'ห้องนี้มีผู้เช่าอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Check if tenant exists and is available
    const tenant = await usersCollection.findOne({
      _id: new ObjectId(tenantId),
      role: 'tenant',
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'ไม่พบผู้เช่าที่ระบุ' },
        { status: 404 }
      );
    }

    if (tenant.roomId) {
      return NextResponse.json(
        { error: 'ผู้เช่านี้มีห้องอยู่แล้ว' },
        { status: 400 }
      );
    }

    // Start transaction-like operations
    const now = new Date();

    // Update room
    const roomUpdateResult = await roomsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isOccupied: true,
          tenantId: new ObjectId(tenantId),
          moveInDate: new Date(moveInDate),
          rentDueDate: rentDueDate,
          depositAmount: depositAmount,
          assignmentNotes: notes || '',
          updatedAt: now,
        },
      }
    );

    if (roomUpdateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถอัปเดตห้องได้' },
        { status: 500 }
      );
    }

    // Update tenant
    const tenantUpdateResult = await usersCollection.updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          roomId: new ObjectId(id),
          moveInDate: new Date(moveInDate),
          rentDueDate: rentDueDate,
          depositAmount: depositAmount,
          updatedAt: now,
        },
      }
    );

    if (tenantUpdateResult.modifiedCount === 0) {
      // Rollback room update
      await roomsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            isOccupied: false,
            updatedAt: now,
          },
          $unset: {
            tenantId: '',
            moveInDate: '',
            rentDueDate: '',
            depositAmount: '',
            assignmentNotes: '',
          },
        }
      );

      return NextResponse.json(
        { error: 'ไม่สามารถอัปเดตข้อมูลผู้เช่าได้' },
        { status: 500 }
      );
    }

    // Fetch updated room with tenant info
    const updatedRoom = await roomsCollection
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'tenantId',
            foreignField: '_id',
            as: 'tenantInfo',
          },
        },
        { $unwind: '$tenantInfo' },
        {
          $project: {
            roomNumber: 1,
            floor: 1,
            rentPrice: 1,
            waterPrice: 1,
            electricityPrice: 1,
            isOccupied: 1,
            moveInDate: 1,
            rentDueDate: 1,
            depositAmount: 1,
            assignmentNotes: 1,
            createdAt: 1,
            updatedAt: 1,
            'tenantInfo._id': 1,
            'tenantInfo.name': 1,
            'tenantInfo.email': 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json(
      {
        success: true,
        message: 'มอบหมายห้องสำเร็จ',
        data: updatedRoom[0] || null,
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'รหัสห้องไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const roomsCollection = db.collection('rooms');
    const usersCollection = db.collection('users');

    // Find room
    const room = await roomsCollection.findOne({ _id: new ObjectId(id) });

    if (!room) {
      return NextResponse.json(
        { error: 'ไม่พบห้องที่ระบุ' },
        { status: 404 }
      );
    }

    if (!room.isOccupied || !room.tenantId) {
      return NextResponse.json(
        { error: 'ห้องนี้ไม่มีผู้เช่าอยู่' },
        { status: 400 }
      );
    }

    const now = new Date();
    const tenantId = room.tenantId;

    // Update room (checkout)
    await roomsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isOccupied: false,
          moveOutDate: now,
          updatedAt: now,
        },
        $unset: {
          tenantId: '',
          moveInDate: '',
          rentDueDate: '',
          assignmentNotes: '',
        },
      }
    );

    // Update tenant
    await usersCollection.updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          moveOutDate: now,
          updatedAt: now,
        },
        $unset: {
          roomId: '',
          moveInDate: '',
          rentDueDate: '',
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'ปลดผู้เช่าออกจากห้องสำเร็จ',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error unassigning room:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการปลดผู้เช่า: ' + error.message },
      { status: 500 }
    );
  }
}