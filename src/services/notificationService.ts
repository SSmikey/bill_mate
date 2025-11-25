import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Bill from '@/models/Bill';
import User from '@/models/User';
// import { sendEmail, getPaymentReminderEmail, getPaymentVerifiedEmail, getPaymentRejectedEmail } from '@/lib/email';
import { format } from 'date-fns';

export async function sendPaymentReminders(daysBefore: number) {
  await connectDB();

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);

  // Find bills due in X days
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bills = await Bill.find({
    status: { $in: ['pending', 'paid'] },
    dueDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).populate('tenantId').populate('roomId');

  let notificationCount = 0;

  for (const bill of bills) {
    const user = bill.tenantId as any;
    const room = bill.roomId as any;

    if (!user || !room) continue;

    try {
      // Create in-app notification
      await Notification.create({
        userId: user._id,
        type: 'payment_reminder',
        title: `แจ้งเตือนการชำระเงิน ${daysBefore} วัน`,
        message: `กรุณาชำระค่าเช่าห้อง ${room.roomNumber} จำนวน ${bill.totalAmount.toLocaleString('th-TH')} บาท ภายในวันที่ ${format(bill.dueDate, 'dd/MM/yyyy')}`,
        billId: bill._id,
        read: false,
        sentAt: new Date(),
      });

      // Send email (disabled for deployment)
      // await sendEmail({
      //   to: user.email,
      //   subject: `แจ้งเตือนการชำระเงิน - ห้อง ${room.roomNumber}`,
      //   html: getPaymentReminderEmail(
      //     user.name,
      //     room.roomNumber,
      //     bill.totalAmount,
      //     format(bill.dueDate, 'dd/MM/yyyy')
      //   ),
      // });

      notificationCount++;
    } catch (error) {
      console.error(`Failed to send notification for bill ${bill._id}:`, error);
    }
  }

  return notificationCount;
}

export async function sendPaymentOverdueNotifications() {
  await connectDB();

  const now = new Date();

  // Find overdue bills
  const bills = await Bill.find({
    status: { $in: ['pending', 'paid'] },
    dueDate: {
      $lt: now,
    },
  }).populate('tenantId').populate('roomId');

  let notificationCount = 0;

  for (const bill of bills) {
    const user = bill.tenantId as any;
    const room = bill.roomId as any;

    if (!user || !room) continue;

    try {
      // Check if notification already exists
      const existingNotification = await Notification.findOne({
        userId: user._id,
        billId: bill._id,
        type: 'overdue',
        sentAt: {
          $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      });

      if (existingNotification) continue;

      // Create in-app notification
      await Notification.create({
        userId: user._id,
        type: 'overdue',
        title: 'เตือนการชำระเงินเกินกำหนด',
        message: `กรุณาชำระค่าเช่าห้อง ${room.roomNumber} จำนวน ${bill.totalAmount.toLocaleString('th-TH')} บาท ซึ่งเกินกำหนดวันที่ ${format(bill.dueDate, 'dd/MM/yyyy')} แล้ว`,
        billId: bill._id,
        read: false,
        sentAt: new Date(),
      });

      notificationCount++;
    } catch (error) {
      console.error(`Failed to send overdue notification for bill ${bill._id}:`, error);
    }
  }

  return notificationCount;
}

export async function notifyPaymentVerified(billId: string, userId: string, amount: number, roomNumber: string, userName: string, email: string) {
  await connectDB();

  try {
    // Create in-app notification
    await Notification.create({
      userId,
      type: 'payment_verified',
      title: 'ยืนยันการชำระเงินเรียบร้อย',
      message: `เราได้รับและยืนยันการชำระเงินของคุณสำหรับห้อง ${roomNumber} จำนวน ${amount.toLocaleString('th-TH')} บาท`,
      billId,
      read: false,
      sentAt: new Date(),
    });

    // Send email (disabled for deployment)
    // await sendEmail({
    //   to: email,
    //   subject: `ยืนยันการชำระเงิน - ห้อง ${roomNumber}`,
    //   html: getPaymentVerifiedEmail(userName, roomNumber, amount),
    // });

    return true;
  } catch (error) {
    console.error('Failed to send payment verified notification:', error);
    return false;
  }
}

export async function notifyPaymentRejected(billId: string, userId: string, reason: string, roomNumber: string, userName: string, email: string) {
  await connectDB();

  try {
    // Create in-app notification
    await Notification.create({
      userId,
      type: 'payment_rejected',
      title: 'ไม่สามารถยืนยันการชำระได้',
      message: `ไม่สามารถยืนยันการชำระเงินสำหรับห้อง ${roomNumber} ได้ เพราะ ${reason}`,
      billId,
      read: false,
      sentAt: new Date(),
    });

    // Send email (disabled for deployment)
    // await sendEmail({
    //   to: email,
    //   subject: `ไม่สามารถยืนยันการชำระ - ห้อง ${roomNumber}`,
    //   html: getPaymentRejectedEmail(userName, roomNumber, reason),
    // });

    return true;
  } catch (error) {
    console.error('Failed to send payment rejected notification:', error);
    return false;
  }
}
