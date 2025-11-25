// src/app/api/bills/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateMonthlyBills } from '@/services/billService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // This endpoint will trigger the bill generation service.
    // In a real scenario, you might pass parameters like month/year.
    const result = await generateMonthlyBills();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Bill Generation API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bills' },
      { status: 500 }
    );
  }
}