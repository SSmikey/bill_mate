// src/app/api/cron/bill-generation/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateMonthlyBills, getBillGenerationStats } from '@/services/billService';

/**
 * POST /api/cron/bill-generation
 * สร้างบิลรายเดือนแบบ manual (Admin only)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบว่าเป็น admin
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง - ต้องเป็น Admin เท่านั้น' },
        { status: 401 }
      );
    }

    console.log(`📄 [BILL GEN] Manual trigger by: ${session.user.email}`);
    console.log(`📄 [BILL GEN] Time: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);

    // สร้างบิล
    const billsCreated = await generateMonthlyBills();

    return NextResponse.json({
      success: true,
      message: `สร้างบิลรายเดือนสำเร็จ ${billsCreated} รายการ`,
      data: {
        billsCreated,
        triggeredBy: session.user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ [BILL GEN] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการสร้างบิล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/bill-generation
 * ดูสถิติการสร้างบิล
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    const stats = await getBillGenerationStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching bill generation stats:', error);
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}