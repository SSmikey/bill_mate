// src/services/emailService.ts
// Email functionality is currently disabled for deployment
// This file contains stub functions to maintain compatibility

import connectDB from '@/lib/mongodb';
import NotificationTemplate from '@/models/NotificationTemplate';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * ส่ง email พื้นฐาน (currently disabled)
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  console.warn('⚠️ Email sending is disabled for deployment');
  return false;
}

/**
 * ส่ง email โดยใช้ template (currently disabled)
 */
export async function sendTemplateEmail(
  templateType: string,
  recipientEmail: string,
  data: Record<string, any>
): Promise<boolean> {
  console.warn('⚠️ Email sending is disabled for deployment');
  return false;
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
 * ส่ง test email (currently disabled)
 */
export async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  console.warn('⚠️ Email sending is disabled for deployment');
  return false;
}

/**
 * Verify email configuration (currently disabled)
 */
export async function verifyEmailConfig(): Promise<boolean> {
  console.warn('⚠️ Email configuration is disabled');
  return false;
}
