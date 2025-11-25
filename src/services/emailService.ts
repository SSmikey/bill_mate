// src/services/emailService.ts
import nodemailer from 'nodemailer';
import connectDB from '@/lib/mongodb';
import NotificationTemplate from '@/models/NotificationTemplate';

// สร้าง transporter สำหรับส่ง email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * ส่ง email พื้นฐาน
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // ตรวจสอบว่ามีการตั้งค่า email หรือไม่
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email credentials not configured, skipping email send');
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'ระบบหอพัก'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });

    console.log(`📧 Email sent: ${info.messageId} to ${options.to}`);
    return true;

  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * ส่ง email โดยใช้ template
 */
export async function sendTemplateEmail(
  templateType: string,
  recipientEmail: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    await connectDB();

    // ดึง template
    const template = await NotificationTemplate.findOne({
      type: templateType,
      isActive: true
    });

    if (!template) {
      console.error(`❌ Template not found or inactive: ${templateType}`);
      return false;
    }

    // Render template with data
    const rendered = template.render(data);

    // ส่ง email
    return await sendEmail({
      to: recipientEmail,
      subject: rendered.subject,
      html: formatEmailHTML(rendered.emailBody, data)
    });

  } catch (error) {
    console.error('❌ Error sending template email:', error);
    return false;
  }
}

/**
 * จัด format HTML สำหรับ email
 */
function formatEmailHTML(body: string, data: Record<string, any>): string {
  const logoUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`
    : '';

  return `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Sarabun', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #007bff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header img {
      max-width: 150px;
      margin-bottom: 10px;
    }
    .header h1 {
      color: #007bff;
      margin: 0;
      font-size: 24px;
    }
    .content {
      white-space: pre-line;
      margin-bottom: 30px;
    }
    .footer {
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo">` : ''}
      <h1>ระบบจัดการหอพัก</h1>
    </div>
    
    <div class="content">
      ${body}
    </div>

    ${data.actionUrl ? `
    <div style="text-align: center;">
      <a href="${data.actionUrl}" class="button">ดูรายละเอียด</a>
    </div>
    ` : ''}

    <div class="footer">
      <p>
        Email นี้ส่งอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ<br>
        หากมีคำถาม กรุณาติดต่อ: ${process.env.CONTACT_EMAIL || 'admin@example.com'}
      </p>
      <p>
        &copy; ${new Date().getFullYear()} ระบบจัดการหอพัก. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * ส่ง test email
 */
export async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  return await sendEmail({
    to: recipientEmail,
    subject: 'ทดสอบการส่ง Email - ระบบหอพัก',
    html: formatEmailHTML(
      `สวัสดีครับ/ค่ะ

นี่คือ email ทดสอบจากระบบจัดการหอพัก

ถ้าคุณได้รับ email นี้ แสดงว่าระบบส่ง email ทำงานได้ปกติ

ขอบคุณครับ/ค่ะ`,
      { actionUrl: process.env.NEXT_PUBLIC_APP_URL }
    )
  });
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('❌ Email credentials not configured');
      return false;
    }

    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
    return true;

  } catch (error) {
    console.error('❌ Email configuration verification failed:', error);
    return false;
  }
}