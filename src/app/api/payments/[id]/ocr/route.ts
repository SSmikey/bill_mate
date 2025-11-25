// src/app/api/payments/[id]/ocr/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { ocrData } = body;

    if (!id || !ocrData) {
      return NextResponse.json(
        { error: 'Payment ID and OCR data are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      { $set: { ocrData: ocrData } },
      { new: true } // Return the updated document
    );

    if (!updatedPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'OCR data updated successfully' });

  } catch (error) {
    console.error('Update OCR Data API Error:', error);
    return NextResponse.json({ error: 'Failed to update OCR data' }, { status: 500 });
  }
}