// src/app/api/notifications/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import NotificationTemplate from '@/models/NotificationTemplate';
import User from '@/models/User';

/**
 * GET /api/notifications/templates
 * Get all notification templates
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น' },
        { status: 401 }
      );
    }

    await connectDB();

    const templates = await NotificationTemplate.find()
      .populate('lastModifiedBy', 'name email')
      .sort({ type: 1 });

    return NextResponse.json({
      success: true,
      data: {
        templates
      }
    });

  } catch (error) {
    console.error('Error fetching notification templates:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/templates
 * Create or update a notification template
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, name, subject, emailBody, inAppTitle, inAppMessage, variables, isActive } = body;

    // Validate required fields
    if (!type || !name || !subject || !emailBody || !inAppTitle || !inAppMessage) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if template type already exists
    const existingTemplate = await NotificationTemplate.findOne({ type });

    if (existingTemplate) {
      // Update existing template
      const updatedTemplate = await NotificationTemplate.findByIdAndUpdate(
        existingTemplate._id,
        {
          name,
          subject,
          emailBody,
          inAppTitle,
          inAppMessage,
          variables: variables || [],
          isActive: isActive !== undefined ? isActive : true,
          version: existingTemplate.version + 1,
          lastModifiedBy: session.user?.id
        },
        { new: true }
      ).populate('lastModifiedBy', 'name email');

      return NextResponse.json({
        success: true,
        message: 'อัพเดท template เรียบร้อยแล้ว',
        data: { template: updatedTemplate }
      });
    } else {
      // Create new template
      const newTemplate = await NotificationTemplate.create({
        type,
        name,
        subject,
        emailBody,
        inAppTitle,
        inAppMessage,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true,
        version: 1,
        lastModifiedBy: session.user?.id
      });

      await newTemplate.populate('lastModifiedBy', 'name email');

      return NextResponse.json({
        success: true,
        message: 'สร้าง template เรียบร้อยแล้ว',
        data: { template: newTemplate }
      });
    }

  } catch (error) {
    console.error('Error saving notification template:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการบันทึก template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/templates
 * Initialize default notification templates
 */
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น' },
        { status: 401 }
      );
    }

    await connectDB();

    // Default templates
    const defaultTemplates = [
      {
        type: 'payment_reminder',
        name: 'แจ้งเตือนการชำระเงิน',
        subject: 'แจ้งเตือนการชำระค่าเช่า - ห้อง {{roomNumber}}',
        emailBody: `
          <h2>แจ้งเตือนการชำระค่าเช่า</h2>
          <p>เรียน คุณ{{userName}}</p>
          <p>นี่คือการแจ้งเตือนเกี่ยวกับการชำระค่าเช่าสำหรับห้อง {{roomNumber}}</p>
          <p><strong>จำนวนเงิน:</strong> {{amount}} บาท</p>
          <p><strong>วันครบกำหนด:</strong> {{dueDate}}</p>
          <p>กรุณาชำระเงินภายในวันครบกำหนดเพื่อหลีกเลี่ยงค่าปรับ</p>
          <p>ขอบคุณครับ</p>
        `,
        inAppTitle: 'แจ้งเตือนการชำระเงิน',
        inAppMessage: 'กรุณาชำระค่าเช่าห้อง {{roomNumber}} จำนวน {{amount}} บาท ภายในวันที่ {{dueDate}}',
        variables: ['userName', 'roomNumber', 'amount', 'dueDate']
      },
      {
        type: 'payment_verified',
        name: 'ยืนยันการชำระเงิน',
        subject: 'ยืนยันการชำระเงินเรียบร้อย - ห้อง {{roomNumber}}',
        emailBody: `
          <h2>ยืนยันการชำระเงิน</h2>
          <p>เรียน คุณ{{userName}}</p>
          <p>เราได้รับและยืนยันการชำระเงินของคุณเรียบร้อยแล้ว</p>
          <p><strong>ห้อง:</strong> {{roomNumber}}</p>
          <p><strong>จำนวนเงิน:</strong> {{amount}} บาท</p>
          <p><strong>วันที่ชำระ:</strong> {{paymentDate}}</p>
          <p>ขอบคุณครับ</p>
        `,
        inAppTitle: 'ยืนยันการชำระเงินเรียบร้อย',
        inAppMessage: 'เราได้รับและยืนยันการชำระเงินของคุณสำหรับห้อง {{roomNumber}} จำนวน {{amount}} บาท',
        variables: ['userName', 'roomNumber', 'amount', 'paymentDate']
      },
      {
        type: 'payment_rejected',
        name: 'ปฏิเสธการชำระเงิน',
        subject: 'ไม่สามารถยืนยันการชำระเงิน - ห้อง {{roomNumber}}',
        emailBody: `
          <h2>ไม่สามารถยืนยันการชำระเงิน</h2>
          <p>เรียน คุณ{{userName}}</p>
          <p>เราไม่สามารถยืนยันการชำระเงินของคุณได้</p>
          <p><strong>ห้อง:</strong> {{roomNumber}}</p>
          <p><strong>จำนวนเงิน:</strong> {{amount}} บาท</p>
          <p><strong>เหตุผล:</strong> {{reason}}</p>
          <p>กรุณาติดต่อเจ้าหน้าที่เพื่อแก้ไขปัญหา</p>
          <p>ขอบคุณครับ</p>
        `,
        inAppTitle: 'ไม่สามารถยืนยันการชำระเงิน',
        inAppMessage: 'ไม่สามารถยืนยันการชำระเงินสำหรับห้อง {{roomNumber}} เนื่องจาก {{reason}}',
        variables: ['userName', 'roomNumber', 'amount', 'reason']
      },
      {
        type: 'overdue',
        name: 'แจ้งเตือนเกินกำหนดชำระ',
        subject: 'แจ้งเตือนเกินกำหนดชำระ - ห้อง {{roomNumber}}',
        emailBody: `
          <h2>แจ้งเตือนเกินกำหนดชำระ</h2>
          <p>เรียน คุณ{{userName}}</p>
          <p>การชำระค่าเช่าของคุณได้เกินกำหนดแล้ว</p>
          <p><strong>ห้อง:</strong> {{roomNumber}}</p>
          <p><strong>จำนวนเงิน:</strong> {{amount}} บาท</p>
          <p><strong>วันครบกำหนด:</strong> {{dueDate}}</p>
          <p><strong>จำนวนวันที่เกินกำหนด:</strong> {{daysOverdue}} วัน</p>
          <p>กรุณาชำระเงินโดยเร็วที่สุดเพื่อหลีกเลี่ยงค่าปรับเพิ่มเติม</p>
          <p>ขอบคุณครับ</p>
        `,
        inAppTitle: 'แจ้งเตือนเกินกำหนดชำระ',
        inAppMessage: 'การชำระค่าเช่าห้อง {{roomNumber}} จำนวน {{amount}} บาท ได้เกินกำหนด {{daysOverdue}} วันแล้ว',
        variables: ['userName', 'roomNumber', 'amount', 'dueDate', 'daysOverdue']
      },
      {
        type: 'bill_generated',
        name: 'สร้างบิลใหม่',
        subject: 'บิลค่าเช่าเดือน {{month}}/{{year}} - ห้อง {{roomNumber}}',
        emailBody: `
          <h2>บิลค่าเช่าใหม่</h2>
          <p>เรียน คุณ{{userName}}</p>
          <p>บิลค่าเช่าของคุณสำหรับเดือน {{month}}/{{year}} ได้สร้างเรียบร้อยแล้ว</p>
          <p><strong>ห้อง:</strong> {{roomNumber}}</p>
          <p><strong>ค่าเช่า:</strong> {{rentAmount}} บาท</p>
          <p><strong>ค่าน้ำ:</strong> {{waterAmount}} บาท</p>
          <p><strong>ค่าไฟ:</strong> {{electricityAmount}} บาท</p>
          <p><strong>รวมทั้งหมด:</strong> {{totalAmount}} บาท</p>
          <p><strong>วันครบกำหนด:</strong> {{dueDate}}</p>
          <p>กรุณาชำระเงินภายในวันครบกำหนด</p>
          <p>ขอบคุณครับ</p>
        `,
        inAppTitle: 'บิลค่าเช่าใหม่',
        inAppMessage: 'บิลค่าเช่าเดือน {{month}}/{{year}} สำหรับห้อง {{roomNumber}} จำนวน {{totalAmount}} บาท ได้สร้างเรียบร้อยแล้ว',
        variables: ['userName', 'roomNumber', 'month', 'year', 'rentAmount', 'waterAmount', 'electricityAmount', 'totalAmount', 'dueDate']
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const templateData of defaultTemplates) {
      const existingTemplate = await NotificationTemplate.findOne({ type: templateData.type });

      if (existingTemplate) {
        // Skip if template already exists
        continue;
      } else {
        // Create new template
        await NotificationTemplate.create({
          ...templateData,
          lastModifiedBy: session.user?.id
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `สร้าง templates เริ่มต้นเรียบร้อยแล้ว ${createdCount} รายการ`,
      data: {
        createdCount,
        updatedCount
      }
    });

  } catch (error) {
    console.error('Error initializing notification templates:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสร้าง templates เริ่มต้น',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}