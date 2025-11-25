import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Maintenance from '@/models/Maintenance';
import { Types } from 'mongoose';

/**
 * GET /api/maintenance
 * ดึงรายการแจ้งซ่อมทั้งหมด พร้อม filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const roomId = searchParams.get('roomId');
    const tenantId = searchParams.get('tenantId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    if (roomId && Types.ObjectId.isValid(roomId)) {
      query.roomId = new Types.ObjectId(roomId);
    }

    if (tenantId && Types.ObjectId.isValid(tenantId)) {
      query.tenantId = new Types.ObjectId(tenantId);
    }

    if (fromDate) {
      query.reportedDate = query.reportedDate || {};
      query.reportedDate.$gte = new Date(fromDate);
    }

    if (toDate) {
      query.reportedDate = query.reportedDate || {};
      query.reportedDate.$lte = new Date(toDate);
    }

    // Count total documents
    const total = await Maintenance.countDocuments(query);

    // Fetch maintenance requests with room and tenant info
    const maintenance = await Maintenance.find(query)
      .populate('roomId', 'roomNumber floor')
      .populate('tenantId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: maintenance,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/maintenance
 * สร้างรายการแจ้งซ่อมใหม่
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      roomId,
      tenantId,
      category,
      title,
      description,
      priority,
      scheduledDate,
      assignedTo,
      notes,
      createdBy,
    } = body;

    // Validate required fields
    if (!roomId || !Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: 'รหัสห้องไม่ถูกต้อง' }, { status: 400 });
    }

    if (!category || !title || !description || !priority) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (!createdBy || !createdBy.userId || !createdBy.name || !createdBy.role) {
      return NextResponse.json(
        { error: 'ข้อมูลผู้สร้างไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    await connectDB();

    // Create maintenance document
    const maintenanceData = {
      roomId: new Types.ObjectId(roomId),
      tenantId: tenantId && Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : undefined,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending',
      reportedDate: new Date(),
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      assignedTo: assignedTo?.trim() || undefined,
      notes: notes?.trim() || undefined,
      createdBy: {
        userId: new Types.ObjectId(createdBy.userId),
        name: createdBy.name,
        role: createdBy.role,
      },
    };

    const maintenance = await Maintenance.create(maintenanceData);

    // Populate references for response
    await maintenance.populate([
      { path: 'roomId', select: 'roomNumber floor' },
      { path: 'tenantId', select: 'name email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'สร้างรายการแจ้งซ่อมสำเร็จ',
        data: maintenance,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างรายการแจ้งซ่อม: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/maintenance
 * อัปเดตรายการแจ้งซ่อม (bulk update)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุรายการที่ต้องการอัปเดต' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลที่ต้องการอัปเดต' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'รหัสรายการไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();

    // Build update object
    const updateObj: any = {};

    if (updates.status) updateObj.status = updates.status;
    if (updates.priority) updateObj.priority = updates.priority;
    if (updates.scheduledDate) updateObj.scheduledDate = new Date(updates.scheduledDate);
    if (updates.completedDate) updateObj.completedDate = new Date(updates.completedDate);
    if (updates.cost !== undefined) updateObj.cost = updates.cost;
    if (updates.assignedTo) updateObj.assignedTo = updates.assignedTo;
    if (updates.notes) updateObj.notes = updates.notes;

    // Update
    const result = await Maintenance.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateObj }
    );

    return NextResponse.json(
      {
        success: true,
        message: `อัปเดต ${result.modifiedCount} รายการสำเร็จ`,
        modifiedCount: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating maintenance requests:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดต: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/maintenance
 * ลบรายการแจ้งซ่อม (bulk delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'กรุณาระบุรายการที่ต้องการลบ' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',');
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'รหัสรายการไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();

    const result = await Maintenance.deleteMany({
      _id: { $in: objectIds },
    });

    return NextResponse.json(
      {
        success: true,
        message: `ลบ ${result.deletedCount} รายการสำเร็จ`,
        deletedCount: result.deletedCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting maintenance requests:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบ: ' + error.message },
      { status: 500 }
    );
  }
}