import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Bill from '@/models/Bill';
import { authOptions } from '@/lib/auth';
import { performOCR } from '@/services/ocrService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { billId, slipImageBase64, ocrData, qrData } = body;

    // Validation
    if (!billId || !slipImageBase64) {
      return NextResponse.json(
        { error: 'กรุณาระบุ billId และ slipImageBase64' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify bill exists and belongs to user (if tenant)
    const bill = await Bill.findById(billId).populate('tenantId').populate('roomId');
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    if (session.user?.role === 'tenant' && bill.tenantId._id.toString() !== session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create payment record
    const payment = await Payment.create({
      billId,
      userId: session.user?.id,
      slipImageUrl: slipImageBase64,
      ocrData: ocrData || {},
      qrData: qrData || {},
      status: 'pending',
    });

    // Update bill status to paid (waiting for verification)
    await Bill.findByIdAndUpdate(billId, { status: 'paid' });

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: 'อัพโหลดสลิปเรียบร้อยแล้ว รอการตรวจสอบ'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload slip' }, { status: 500 });
  }
}
