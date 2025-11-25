import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Bill from '@/models/Bill';
import { authOptions } from '@/lib/auth';
import { notifyPaymentVerified, notifyPaymentRejected } from '@/services/notificationService';

// PUT verify/reject payment (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { approved, rejectionReason } = body;

    if (approved === undefined) {
      return NextResponse.json(
        { error: 'Please specify approved status' },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findById(id)
      .populate({
        path: 'billId',
        populate: { path: 'roomId' }
      })
      .populate('userId');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const bill = payment.billId as any;
    const user = payment.userId as any;

    if (approved) {
      // Update payment status
      payment.status = 'verified';
      if (session.user?.id) {
        payment.verifiedBy = session.user.id as any;
      }
      payment.verifiedAt = new Date();
      await payment.save();

      // Update bill status
      await Bill.findByIdAndUpdate(bill._id, { status: 'verified' });

      // Send notification
      await notifyPaymentVerified(
        bill._id.toString(),
        user._id.toString(),
        bill.totalAmount,
        bill.roomId.roomNumber,
        user.name,
        user.email
      );

      return NextResponse.json({
        success: true,
        data: payment,
        message: 'ยืนยันการชำระเรียบร้อยแล้ว'
      });
    } else {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Please provide rejection reason' },
          { status: 400 }
        );
      }

      // Update payment status
      payment.status = 'rejected';
      payment.rejectionReason = rejectionReason;
      await payment.save();

      // Update bill status back to pending
      await Bill.findByIdAndUpdate(bill._id, { status: 'pending' });

      // Send notification
      await notifyPaymentRejected(
        bill._id.toString(),
        user._id.toString(),
        rejectionReason,
        bill.roomId.roomNumber,
        user.name,
        user.email
      );

      return NextResponse.json({
        success: true,
        data: payment,
        message: 'ปฏิเสธการชำระเรียบร้อยแล้ว'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
