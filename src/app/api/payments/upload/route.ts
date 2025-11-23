import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Bill from '@/models/Bill';
import { authOptions } from '@/lib/auth';
import { performOCR } from '@/services/ocrService';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Uploads a base64 encoded image to AWS S3 and returns the public URL.
 * @param base64Image The base64 encoded image string (e.g., "data:image/jpeg;base64,...")
 * @returns The public URL of the uploaded file.
 */
async function uploadToCloudStorage(base64Image: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  // Extract content type and base64 data
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid base64 image string');
  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  const fileName = `slips/${Date.now()}-${Math.round(Math.random() * 1E9)}.${contentType.split('/')[1]}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return `https://${bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;
}

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

    // --- การเปลี่ยนแปลงเริ่มที่นี่ ---
    // 1. อัปโหลดไฟล์ Base64 ไปยัง Cloud Storage
    const imageUrl = await uploadToCloudStorage(slipImageBase64);

    // Create payment record
    const payment = await Payment.create({
      billId,
      userId: session.user?.id,
      slipImageUrl: imageUrl, // 2. บันทึก URL ที่ได้จาก Cloud Storage แทน Base64
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
