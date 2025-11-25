// src/services/billService.ts
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import Room from '@/models/Room';
import Notification from '@/models/Notification';

/**
 * สร้างบิลอัตโนมัติสำหรับทุกห้องที่มีผู้เช่า
 * ทำงานทุกวันที่ 1 ของเดือน
 */
export async function generateMonthlyBills(): Promise<number> {
  await connectDB();

  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  console.log(`📄 [BILL GEN] Starting monthly bill generation for ${getThaiMonth(month)} ${year + 543}`);

  // หาห้องที่มีผู้เช่าทั้งหมด
  const occupiedRooms = await Room.find({ isOccupied: true })
    .populate('tenantId');

  if (occupiedRooms.length === 0) {
    console.log('📄 [BILL GEN] No occupied rooms found');
    return 0;
  }

  console.log(`📄 [BILL GEN] Found ${occupiedRooms.length} occupied rooms`);

  let billsCreated = 0;
  let billsSkipped = 0;
  const errors: string[] = [];

  for (const room of occupiedRooms) {
    try {
      // เช็คว่ามีบิลเดือนนี้แล้วหรือยัง
      const existingBill = await Bill.findOne({
        roomId: room._id,
        month,
        year
      });

      if (existingBill) {
        console.log(`📄 [BILL GEN] Bill already exists for room ${room.roomNumber}`);
        billsSkipped++;
        continue;
      }

      // คำนวณวันครบกำหนด (วันที่ 25 ของเดือนนี้)
      const dueDate = new Date(year, month - 1, 25);
      
      // ถ้าวันนี้เกินวันที่ 25 แล้ว ให้ครบกำหนดเดือนหน้า
      if (now.getDate() > 25) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      // คำนวณยอดรวม
      const totalAmount = (room.rentPrice || 0) + 
                         (room.waterPrice || 0) + 
                         (room.electricityPrice || 0);

      // สร้างบิลใหม่
      const bill = await Bill.create({
        roomId: room._id,
        tenantId: room.tenantId._id,
        month,
        year,
        rentAmount: room.rentPrice || 0,
        waterAmount: room.waterPrice || 0,
        electricityAmount: room.electricityPrice || 0,
        totalAmount,
        dueDate,
        status: 'pending',
        waterUnits: 0,
        electricityUnits: 0,
        previousWaterReading: 0,
        currentWaterReading: 0,
        previousElectricReading: 0,
        currentElectricReading: 0
      });

      console.log(`✅ [BILL GEN] Created bill for room ${room.roomNumber} - ${totalAmount} บาท`);
      billsCreated++;

      // สร้าง notification แจ้งผู้เช่า
      await Notification.create({
        userId: room.tenantId._id,
        type: 'bill_generated',
        title: `บิลเดือน ${getThaiMonth(month)} ${year + 543}`,
        message: `บิลค่าเช่าห้อง ${room.roomNumber} จำนวน ${totalAmount.toLocaleString('th-TH')} บาท ถูกสร้างแล้ว กรุณาชำระภายในวันที่ ${dueDate.getDate()}/${month}/${year + 543}`,
        billId: bill._id,
        read: false,
        sentAt: new Date()
      });

      console.log(`📧 [BILL GEN] Notification sent to tenant of room ${room.roomNumber}`);

    } catch (error) {
      const errorMsg = `Error creating bill for room ${room.roomNumber}: ${error}`;
      console.error(`❌ [BILL GEN] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('📄 [BILL GEN] Monthly Bill Generation Summary');
  console.log('='.repeat(60));
  console.log(`✅ Bills created: ${billsCreated}`);
  console.log(`⏭️  Bills skipped (already exists): ${billsSkipped}`);
  console.log(`❌ Errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Error details:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }
  console.log('='.repeat(60));
  console.log('');

  return billsCreated;
}

/**
 * แปลงเลขเดือนเป็นชื่อภาษาไทย
 */
function getThaiMonth(month: number): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[month - 1] || 'ไม่ทราบ';
}

/**
 * ดึงข้อมูลสถิติการสร้างบิล
 */
export async function getBillGenerationStats() {
  await connectDB();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [
    currentMonthBills,
    totalRooms,
    occupiedRooms,
    pendingBills,
    paidBills
  ] = await Promise.all([
    Bill.countDocuments({ month: currentMonth, year: currentYear }),
    Room.countDocuments({}),
    Room.countDocuments({ isOccupied: true }),
    Bill.countDocuments({ month: currentMonth, year: currentYear, status: 'pending' }),
    Bill.countDocuments({ month: currentMonth, year: currentYear, status: 'paid' })
  ]);

  return {
    currentMonth: getThaiMonth(currentMonth),
    currentYear: currentYear + 543,
    billsGenerated: currentMonthBills,
    totalRooms,
    occupiedRooms,
    pendingBills,
    paidBills,
    completionRate: occupiedRooms > 0 
      ? Math.round((currentMonthBills / occupiedRooms) * 100) 
      : 0
  };
}