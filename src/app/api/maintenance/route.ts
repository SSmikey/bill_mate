import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import MaintenanceModel, { type IMaintenanceDocument } from '@/models/Maintenance';

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

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const maintenanceCollection = db.collection<IMaintenanceDocument>('maintenance');

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

    if (roomId && ObjectId.isValid(roomId)) {
      query.roomId = new ObjectId(roomId);
    }

    if (tenantId && ObjectId.isValid(tenantId)) {
      query.tenantId = new ObjectId(tenantId);
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
    const total = await maintenanceCollection.countDocuments(query);

    // Fetch maintenance requests with room and tenant info
    const maintenance = await maintenanceCollection
      .aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Lookup room info
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'roomInfo',
          },
        },
        { $unwind: { path: '$roomInfo', preserveNullAndEmptyArrays: true } },
        // Lookup tenant info
        {
          $lookup: {
            from: 'users',
            localField: 'tenantId',
            foreignField: '_id',
            as: 'tenantInfo',
          },
        },
        { $unwind: { path: '$tenantInfo', preserveNullAndEmptyArrays: true } },
        // Project fields
        {
          $project: {
            category: 1,
            title: 1,
            description: 1,
            priority: 1,
            status: 1,
            reportedDate: 1,
            scheduledDate: 1,
            completedDate: 1,
            cost: 1,
            assignedTo: 1,
            notes: 1,
            images: 1,
            createdBy: 1,
            createdAt: 1,
            updatedAt: 1,
            'roomInfo._id': 1,
            'roomInfo.roomNumber': 1,
            'roomInfo.floor': 1,
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
    if (!roomId || !ObjectId.isValid(roomId)) {
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

    const now = new Date();

    // Create maintenance document
    const maintenanceDoc: IMaintenanceDocument = {
      roomId: new ObjectId(roomId),
      tenantId: tenantId && ObjectId.isValid(tenantId) ? new ObjectId(tenantId) : undefined,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'pending',
      reportedDate: now,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      assignedTo: assignedTo?.trim() || undefined,
      notes: notes?.trim() || undefined,
      createdBy: {
        userId: new ObjectId(createdBy.userId),
        name: createdBy.name,
        role: createdBy.role,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Validate
    const validation = MaintenanceModel.validate(maintenanceDoc);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const maintenanceCollection = db.collection<IMaintenanceDocument>('maintenance');

    // Insert
    const result = await maintenanceCollection.insertOne(maintenanceDoc);

    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'ไม่สามารถสร้างรายการแจ้งซ่อมได้' },
        { status: 500 }
      );
    }

    // Fetch created maintenance with room info
    const created = await maintenanceCollection
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: 'rooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'roomInfo',
          },
        },
        { $unwind: '$roomInfo' },
        {
          $project: {
            category: 1,
            title: 1,
            description: 1,
            priority: 1,
            status: 1,
            reportedDate: 1,
            scheduledDate: 1,
            assignedTo: 1,
            notes: 1,
            createdBy: 1,
            createdAt: 1,
            updatedAt: 1,
            'roomInfo._id': 1,
            'roomInfo.roomNumber': 1,
            'roomInfo.floor': 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json(
      {
        success: true,
        message: 'สร้างรายการแจ้งซ่อมสำเร็จ',
        data: created[0] || null,
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
    const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'รหัสรายการไม่ถูกต้อง' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const maintenanceCollection = db.collection<IMaintenanceDocument>('maintenance');

    // Build update object
    const updateObj: any = {
      updatedAt: new Date(),
    };

    if (updates.status) updateObj.status = updates.status;
    if (updates.priority) updateObj.priority = updates.priority;
    if (updates.scheduledDate) updateObj.scheduledDate = new Date(updates.scheduledDate);
    if (updates.completedDate) updateObj.completedDate = new Date(updates.completedDate);
    if (updates.cost !== undefined) updateObj.cost = updates.cost;
    if (updates.assignedTo) updateObj.assignedTo = updates.assignedTo;
    if (updates.notes) updateObj.notes = updates.notes;

    // Update
    const result = await maintenanceCollection.updateMany(
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
    const objectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'รหัสรายการไม่ถูกต้อง' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('bill_mate');
    const maintenanceCollection = db.collection<IMaintenanceDocument>('maintenance');

    const result = await maintenanceCollection.deleteMany({
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