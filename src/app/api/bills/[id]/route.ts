import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { authOptions } from '@/lib/auth';

// GET single bill by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const bill = await Bill.findById(id)
      .populate('roomId', 'roomNumber')
      .populate('tenantId', 'name email');

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Check if user has permission to view this bill
    if (session.user?.role === 'tenant' && bill.tenantId._id.toString() !== session.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    console.error('Error fetching bill:', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

// PATCH update bill (for payment uploads, admin verifications, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const bill = await Bill.findById(id);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    // Update bill based on user role
    if (session.user?.role === 'tenant') {
      // Tenant can only update payment info
      if (body.paymentSlip || body.status === 'paid') {
        bill.paymentSlip = body.paymentSlip || bill.paymentSlip;
        bill.status = 'paid';
        bill.paymentDate = new Date();
      }
    } else if (session.user?.role === 'admin') {
      // Admin can update anything
      Object.assign(bill, body);
    }

    await bill.save();

    return NextResponse.json({ success: true, data: bill });
  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}

// DELETE bill (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const bill = await Bill.findByIdAndDelete(id);

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
