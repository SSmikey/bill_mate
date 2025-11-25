import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  try {
    const { filename } = await params;

    // Connect to database and find payment with this URL reference
    await connectDB();

    const payment = await Payment.findOne({
      slipImageUrl: `/api/slips/${filename.join('/')}`
    });

    if (!payment || !payment.slipImageData) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // The slipImageData is already a base64 data URL (data:image/...;base64,...)
    const base64String = payment.slipImageData;

    // Parse the data URL to get content type and base64 data
    const match = base64String.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      console.error('Invalid base64 format in database');
      return NextResponse.json({ error: 'Invalid image data' }, { status: 500 });
    }

    const contentType = match[1];
    const base64Data = match[2];

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving slip image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}