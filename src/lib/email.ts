// Email functionality is currently disabled for deployment
// This file contains stub functions to maintain compatibility

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  console.log('Email sending is disabled. Would have sent to:', to);
  return false;
}

export function getPaymentReminderEmail(name: string, roomNumber: string, amount: number, dueDate: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">แจ้งเตือนการชำระเงิน</h2>
        <p style="color: #666; font-size: 16px;">เรียน คุณ<strong> ${name}</strong></p>

        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 10px 0;"><strong>ห้องที่:</strong> ${roomNumber}</p>
          <p style="margin: 10px 0;"><strong>จำนวนเงิน:</strong> ${amount.toLocaleString('th-TH')} บาท</p>
          <p style="margin: 10px 0;"><strong>ครบกำหนดชำระ:</strong> ${dueDate}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          กรุณาชำระค่าเช่าและค่าใช้บริการให้ครบตามจำนวนข้างต้น
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px; margin-bottom: 0;">
          ✓ หากชำระเงินแล้ว กรุณาอัพโหลดสลิปการโอนผ่านระบบ Bill Mate เพื่อให้เราตรวจสอบและยืนยันการชำระ
        </p>
      </div>
    </div>
  `;
}

export function getPaymentVerifiedEmail(name: string, roomNumber: string, amount: number) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #28a745; margin-top: 0;">✓ ยืนยันการชำระเงินเรียบร้อย</h2>
        <p style="color: #666; font-size: 16px;">เรียน คุณ<strong> ${name}</strong></p>

        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 10px 0;"><strong>ห้องที่:</strong> ${roomNumber}</p>
          <p style="margin: 10px 0;"><strong>จำนวนเงิน:</strong> ${amount.toLocaleString('th-TH')} บาท</p>
          <p style="margin: 10px 0; color: #28a745;"><strong>สถานะ:</strong> ยืนยันเรียบร้อย</p>
        </div>

        <p style="color: #28a745; font-size: 14px;">
          เราได้รับและยืนยันการชำระเงินของคุณเรียบร้อยแล้ว ขอบคุณที่ชำระตรงเวลา!
        </p>
      </div>
    </div>
  `;
}

export function getPaymentRejectedEmail(name: string, roomNumber: string, reason: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #dc3545; margin-top: 0;">⚠ ไม่สามารถยืนยันการชำระได้</h2>
        <p style="color: #666; font-size: 16px;">เรียน คุณ<strong> ${name}</strong></p>

        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
          <p style="margin: 10px 0;"><strong>ห้องที่:</strong> ${roomNumber}</p>
          <p style="margin: 10px 0; color: #dc3545;"><strong>เหตุผล:</strong> ${reason}</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          กรุณาตรวจสอบข้อมูลและลองอัพโหลดสลิปใหม่ หรือติดต่อเจ้าของหอพัก หากมีคำถาม
        </p>
      </div>
    </div>
  `;
}
