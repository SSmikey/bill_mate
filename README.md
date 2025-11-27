# 🏢 Bill Mate - ระบบจัดการหอพักอัจฉริยะ

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248)

**ระบบจัดการหอพักครบวงจร พร้อมเทคโนโลยี OCR และ QR Code สำหรับการตรวจสอบการชำระเงินอัตโนมัติ**

[Features](#-คุณสมบัติเด่น) • [Quick Start](#-การติดตั้งและใช้งาน) • [Documentation](#-โครงสร้างโปรเจค) • [Team](#-ทีมผู้พัฒนา)

---

### 📸 ภาพตัวอย่างระบบ

<img src="public/img_screenshots/screenshots_web.png" alt="Bill Mate Dashboard" width="100%">

</div>

---

## 📋 สารบัญ

- [เกี่ยวกับโปรเจค](#-เกี่ยวกับโปรเจค)
- [คุณสมบัติเด่น](#-คุณสมบัติเด่น)
- [เทคโนโลยีที่ใช้](#-เทคโนโลยีที่ใช้)
- [ความต้องการของระบบ](#-ความต้องการของระบบ)
- [การติดตั้งและใช้งาน](#-การติดตั้งและใช้งาน)
- [การตั้งค่า Environment Variables](#-การตั้งค่า-environment-variables)
- [โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
- [คำสั่ง NPM Scripts](#-คำสั่ง-npm-scripts)
- [API Routes](#-api-routes)
- [การ Deploy](#-การ-deploy)
- [การพัฒนาและทดสอบ](#-การพัฒนาและทดสอบ)
- [Contributing](#-contributing)
- [ทีมผู้พัฒนา](#-ทีมผู้พัฒนา)

---

## 🎯 เกี่ยวกับโปรเจค

**Bill Mate** เป็นระบบบริหารจัดการหอพักแบบครบวงจร ที่ออกแบบมาเพื่อช่วยให้เจ้าของหอพักและผู้เช่าสามารถจัดการค่าเช่า ค่าน้ำ ค่าไฟ และการชำระเงินได้อย่างมีประสิทธิภาพ ด้วยเทคโนโลยี **OCR** (Optical Character Recognition) และ **QR Code** ที่ช่วยตรวจสอบสลิปการโอนเงินอัตโนมัติ

ระบบนี้พัฒนาด้วย **Next.js 15** (App Router), **NextAuth** สำหรับการจัดการ authentication, **MongoDB** เป็นฐานข้อมูล และรองรับการจัดเก็บไฟล์บน **AWS S3** พร้อมระบบแจ้งเตือนอัตโนมัติทางอีเมล

> 💡 **โปรเจคนี้เหมาะสำหรับ**: เจ้าของหอพัก, ผู้จัดการอสังหาริมทรัพย์, และผู้ที่ต้องการระบบจัดการการเงินที่มีประสิทธิภาพ

---

## ✨ คุณสมบัติเด่น

<table>
<tr>
<td width="50%">

### 👥 การจัดการผู้ใช้งาน
- ✅ **2 ระดับสิทธิ์**: Administrator และ Tenant (ผู้เช่า)
- ✅ ระบบ Authentication ที่ปลอดภัยด้วย NextAuth (JWT Session)
- ✅ การจัดการโปรไฟล์และข้อมูลส่วนตัว

### 💰 การจัดการบิลและการชำระเงิน
- ✅ สร้างและส่งบิลค่าเช่า ค่าน้ำ ค่าไฟแบบอัตโนมัติ
- ✅ ติดตามสถานะการชำระเงินแบบ Real-time
- ✅ ประวัติการชำระเงินและรายงานสรุป

### 🔍 เทคโนโลยี OCR และ QR Code
- ✅ **Tesseract.js**: OCR Engine สำหรับอ่านข้อความจากสลิป
- ✅ **Google Cloud Vision API**: OCR แม่นยำสูงสำหรับเอกสารภาษาไทย
- ✅ **QR Code Scanner**: ตรวจสอบความถูกต้องของสลิปด้วย QR Code

</td>
<td width="50%">

### 🏠 การจัดการห้องพัก
- ✅ จัดการข้อมูลห้องพัก อัตราค่าเช่า และสถานะ
- ✅ กำหนดผู้เช่าเข้าห้องพัก
- ✅ รายงานสถานะห้องว่าง/ห้องเต็ม

### 🔔 ระบบแจ้งเตือน
- ✅ แจ้งเตือนทางอีเมลเมื่อมีบิลใหม่
- ✅ แจ้งเตือนเมื่อชำระเงินสำเร็จ
- ✅ แจ้งเตือนค่าเช่าค้างชำระ
- ✅ Notification Center ในระบบ

### 📦 การจัดเก็บไฟล์
- ✅ รองรับการเก็บไฟล์แบบ Local Storage
- ✅ รองรับ AWS S3 สำหรับ Cloud Storage
- ✅ จัดการไฟล์สลิปและเอกสารแนบ

### ⏰ ระบบ Cron Jobs
- ✅ ตรวจสอบบิลค้างชำระอัตโนมัติ
- ✅ ส่งการแจ้งเตือนตามกำหนดเวลา
- ✅ สร้างบิลประจำเดือนอัตโนมัติ

</td>
</tr>
</table>

---

## 🛠 เทคโนโลยีที่ใช้

### 📚 Tech Stack

#### Frontend
- **Next.js 15** - React Framework with App Router
- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Bootstrap 5** - CSS Framework
- **React-Bootstrap** - React Components

#### Backend & Database
- **Next.js API Routes** - RESTful API
- **NextAuth.js** - Authentication & Authorization
- **MongoDB** - NoSQL Database
- **Mongoose** - ODM (Object Data Modeling)

#### OCR & Image Processing
- **Tesseract.js** - JavaScript OCR Engine
- **Google Cloud Vision API** - Advanced OCR
- **QR Code Scanner** - QR Code Detection

#### Cloud Services
- **AWS S3** - Cloud File Storage
- **@aws-sdk/client-s3** - AWS SDK for JavaScript

#### Development Tools
- **ESLint** - Code Linting
- **Prettier** - Code Formatting
- **Nodemailer** - Email Service

---

## 💻 ความต้องการของระบบ

### Software Requirements
- **Node.js** >= 18.0.0
- **npm** หรือ **yarn** หรือ **pnpm**
- **MongoDB** >= 7.0 (Local หรือ MongoDB Atlas)

### Optional Services
- **Google Cloud Platform Account** (สำหรับ Vision API)
- **AWS Account** (สำหรับ S3 Storage)
- **Email Service** (SMTP Server สำหรับส่งอีเมล)

---

## 🚀 การติดตั้งและใช้งาน

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/bill_mate.git
cd bill_mate
```

### 2. ติดตั้ง Dependencies

```bash
npm install
# หรือ
yarn install
# หรือ
pnpm install
```

### 3. สร้างไฟล์ Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลัก:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bill_mate

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Storage
USE_CLOUD_STORAGE=false

# AWS S3 (Optional - ถ้า USE_CLOUD_STORAGE=true)
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_REGION=ap-southeast-1

# Google Cloud Vision (Optional)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Email Service
PROTOCOL=http
CONTACT_EMAIL=admin@example.com

# Initial Admin Account
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
ADMIN_NAME=Administrator
ADMIN_PHONE=0812345678
```

### 4. สร้างบัญชี Administrator แรก

```bash
npm run create-admin
```

### 5. รันโปรเจคในโหมดพัฒนา

```bash
npm run dev
```

เปิดเบราว์เซอร์และเข้าไปที่ `http://localhost:3000`

---

## 🔐 การตั้งค่า Environment Variables

### ตัวแปรที่จำเป็น (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `NEXTAUTH_SECRET` | Secret key สำหรับ NextAuth | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL ของแอปพลิเคชัน | `http://localhost:3000` |

### ตัวแปรเพิ่มเติม (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_CLOUD_STORAGE` | ใช้ AWS S3 หรือไม่ | `false` |
| `AWS_S3_BUCKET_NAME` | ชื่อ S3 Bucket | - |
| `AWS_ACCESS_KEY_ID` | AWS Access Key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key | - |
| `AWS_S3_REGION` | AWS Region | `ap-southeast-1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google credentials | - |

### การสร้าง NEXTAUTH_SECRET

```bash
# วิธีที่ 1: ใช้ OpenSSL
openssl rand -base64 32

# วิธีที่ 2: ใช้ Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📁 โครงสร้างโปรเจค

```
bill_mate/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── admin/               # Admin routes
│   │   │   ├── dashboard/
│   │   │   ├── bills/
│   │   │   ├── rooms/
│   │   │   └── users/
│   │   ├── tenant/              # Tenant routes
│   │   │   ├── dashboard/
│   │   │   └── bills/
│   │   ├── api/                 # API routes
│   │   │   ├── auth/
│   │   │   ├── bills/
│   │   │   ├── payments/
│   │   │   └── notifications/
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── components/              # React components
│   │   ├── Navbar.tsx
│   │   ├── DataTable.tsx
│   │   ├── PageHeader.tsx
│   │   └── ...
│   ├── lib/                     # Utility functions
│   │   ├── auth.ts              # NextAuth configuration
│   │   ├── mongodb.ts           # Database connection
│   │   ├── fileStorage.ts       # File upload handler
│   │   └── security.ts          # Security utilities
│   ├── models/                  # Mongoose models
│   │   ├── User.ts
│   │   ├── Bill.ts
│   │   ├── Room.ts
│   │   ├── Payment.ts
│   │   └── Notification.ts
│   ├── services/                # Business logic
│   │   ├── ocrService.ts        # OCR processing
│   │   ├── qrService.ts         # QR code handling
│   │   ├── emailService.ts      # Email notifications
│   │   └── cronService.ts       # Scheduled jobs
│   └── types/                   # TypeScript types
│       └── index.d.ts
├── scripts/
│   ├── init-db.js               # Database initialization
│   └── create-admin.ts          # Create admin user
├── public/                      # Static files
│   ├── uploads/                 # Local file storage
│   └── icons/                   # Bootstrap icons
├── .env.local                   # Environment variables
├── .eslintrc.json              # ESLint configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies
```

---

## 📝 คำสั่ง NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | รันโปรเจคในโหมด development |
| `npm run build` | Build โปรเจคสำหรับ production |
| `npm run start` | รันโปรเจคใน production mode |
| `npm run lint` | ตรวจสอบ code ด้วย ESLint |
| `npm run create-admin` | สร้างบัญชี admin จาก .env |

---

## 🔌 API Routes

### Authentication
- `POST /api/auth/signin` - เข้าสู่ระบบ
- `POST /api/auth/signout` - ออกจากระบบ
- `POST /api/auth/signup` - สมัครสมาชิก

### Bills Management
- `GET /api/bills` - ดึงรายการบิลทั้งหมด
- `POST /api/bills` - สร้างบิลใหม่
- `GET /api/bills/:id` - ดูรายละเอียดบิล
- `PUT /api/bills/:id` - แก้ไขบิล
- `DELETE /api/bills/:id` - ลบบิล

### Payments
- `GET /api/payments` - ดึงรายการการชำระเงิน
- `POST /api/payments` - บันทึกการชำระเงิน
- `PUT /api/payments/:id` - อัปเดตสถานะการชำระ

### Slips Processing
- `POST /api/slips/upload` - อัปโหลดสลิปการโอน
- `POST /api/slips/ocr` - ประมวลผล OCR
- `POST /api/slips/qr` - อ่าน QR Code

### Users & Rooms
- `GET /api/users` - ดึงรายการผู้ใช้
- `GET /api/rooms` - ดึงรายการห้องพัก
- `POST /api/rooms` - สร้างห้องพักใหม่

### Notifications
- `GET /api/notifications` - ดึงการแจ้งเตือน
- `PUT /api/notifications/:id/read` - อ่านการแจ้งเตือน

---

## 🌐 การ Deploy

### Vercel (แนะนำ)

1. Push โค้ดขึ้น GitHub

2. เชื่อมต่อกับ Vercel
```bash
npm install -g vercel
vercel login
vercel
```

3. ตั้งค่า Environment Variables ใน Vercel Dashboard

4. Deploy
```bash
vercel --prod
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
docker build -t bill-mate .
docker run -p 3000:3000 --env-file .env.local bill-mate
```

---

## 🧪 การพัฒนาและทดสอบ

### Development Workflow

1. สร้าง feature branch
```bash
git checkout -b feature/your-feature-name
```

2. พัฒนาและทดสอบ
```bash
npm run dev
npm run lint
```

3. Commit และ Push
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
```

### Code Style Guidelines

- ใช้ TypeScript สำหรับ type safety
- ตั้งชื่อตัวแปรและฟังก์ชันแบบ camelCase
- Component names ใช้ PascalCase
- เขียน comments สำหรับโค้ดที่ซับซ้อน
- ใช้ async/await แทน Promise chains

---

## 🤝 Contributing

เรายินดีรับ contributions! หากคุณพบ bug หรือต้องการเพิ่มฟีเจอร์ใหม่:

1. Fork โปรเจค
2. สร้าง Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง Branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

---

## 👨‍💻 ทีมผู้พัฒนา

<div align="center">

| ชื่อ-นามสกุล | รหัสนักศึกษา |
|:---:|:---:|
| **นายสิทธิชัย แสงนนท์** | 6612732134 |
| **นายพีรพัฒน์ สุทธปัญญา** | 6612732121 |
| **นางสาววาสินี มาฤทธิ์** | 6712732126 |
| **นางสาววรัญญา ฉิมงาม** | 6712732125 |

<br>

**🎓 สาขาวิชา**: วิทยาการคอมพิวเตอร์  
**🏛️ สถาบัน**: มหาวิทยาลัยราชภัฏศรีสะเกษ

</div>

---

<div align="center">

**Made with ❤️ by Bill Mate Development Team**

⭐ ถ้าโปรเจคนี้มีประโยชน์ อย่าลืมกด Star ด้วยนะคะ!

</div>