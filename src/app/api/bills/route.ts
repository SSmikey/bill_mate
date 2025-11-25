import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import { authOptions } from '@/lib/auth';

// GET bills (filtered by role)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let query: any = {};
    if (session.user?.role === 'tenant') {
      query = { tenantId: session.user?.id };
    }

    const bills = await Bill.find(query)
      .populate('roomId', 'roomNumber')
      .populate('tenantId', 'name email')
      .sort({ year: -1, month: -1 });

    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}
