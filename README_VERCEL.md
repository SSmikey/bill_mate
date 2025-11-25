# 🚀 Bill Mate - Vercel Deployment Guide

ระบบจัดการหอพักและค่าใช้จ่าย สำหรับ Deploy บน Vercel

## 📋 สารบัญ

- [Quick Start](#-quick-start-15-20-นาที)
- [การเตรียมการ](#-การเตรียมการ)
- [ขั้นตอน Deploy](#-ขั้นตอน-deploy)
- [Environment Variables](#-environment-variables)
- [Post-Deployment](#-post-deployment)
- [Troubleshooting](#-troubleshooting)

---

## ⚡ Quick Start (15-20 นาที)

อ่านคู่มือฉบับย่อได้ที่ → [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)

---

## 📦 การเตรียมการ

### 1. MongoDB Atlas (ฟรี)

✅ สร้าง account ที่ https://www.mongodb.com/cloud/atlas
✅ สร้าง Free Cluster (M0 Sandbox)
✅ ตั้งค่า Network Access: `0.0.0.0/0` (Allow from anywhere)
✅ สร้าง Database User และบันทึก credentials
✅ คัดลอก Connection String

### 2. Email Service (Gmail)

✅ เปิด 2-Factor Authentication
✅ สร้าง App Password ที่ Google Account Security
✅ บันทึก App Password (16 ตัวอักษร)

### 3. Vercel Account

✅ สร้าง account ที่ https://vercel.com (ฟรี)
✅ เชื่อมต่อกับ GitHub account

---

## 🎯 ขั้นตอน Deploy

### วิธีที่ 1: Deploy ผ่าน Vercel Dashboard (แนะนำ)

1. Push code ขึ้น GitHub repository
2. ไปที่ https://vercel.com/dashboard
3. กด **"Add New..." → Project**
4. Import repository `bill_mate`
5. ตั้งค่า:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
6. กด **Deploy** (ยังไม่ต้องใส่ environment variables)

### วิธีที่ 2: Deploy ผ่าน Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## 🔐 Environment Variables

### Required Variables (ต้องมี)

ไปที่ Vercel Dashboard → Project → Settings → Environment Variables

```env
# ======================================
# 1. Application Settings
# ======================================
NODE_ENV=production
PROTOCOL=https

# ======================================
# 2. NextAuth Configuration (REQUIRED)
# ======================================
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_INTERNAL_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-command-below>

# สร้าง NEXTAUTH_SECRET:
# Mac/Linux: openssl rand -base64 32
# Windows PowerShell:
# [Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))

# ======================================
# 3. MongoDB Database (REQUIRED)
# ======================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/billmate?retryWrites=true&w=majority
MONGODB_DB=billmate

# ⚠️ แทนที่ username, password, และ cluster URL จาก MongoDB Atlas

# ======================================
# 4. Email Service (REQUIRED)
# ======================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<16-char-app-password>
EMAIL_FROM_NAME=ระบบหอพัก

# ⚠️ ใช้ App Password จาก Google (ไม่ใช่รหัสผ่านปกติ)

# ======================================
# 5. Application URLs (REQUIRED)
# ======================================
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CONTACT_EMAIL=admin@yourdomain.com

# ⚠️ อัพเดท URL ให้ตรงกับ Vercel deployment URL
```

### Admin Setup Variables (ใช้ครั้งแรกอย่างเดียว)

```env
# ======================================
# 6. Admin Initialization (First-time only)
# ======================================
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_NAME=Admin Name
ADMIN_PHONE=+66812345678

# ⚠️ ลบทิ้งหลังจากสร้าง admin user เรียบร้อยแล้ว
```

### Optional Variables

```env
# ======================================
# 7. Cloud Storage (Optional - AWS S3)
# ======================================
USE_CLOUD_STORAGE=false

# ถ้าต้องการใช้ S3 สำหรับเก็บไฟล์:
# AWS_S3_REGION=ap-southeast-1
# AWS_S3_BUCKET_NAME=your-bucket-name
# AWS_ACCESS_KEY_ID=your-access-key-id
# AWS_SECRET_ACCESS_KEY=your-secret-access-key

# ======================================
# 8. Additional Settings (Optional)
# ======================================
APP_NAME=Bill Mate
CRON_SECRET=<random-secret-for-cron-endpoints>
```

### การตั้งค่า Environment Variables ใน Vercel

1. คัดลอก environment variables จากด้านบน
2. ไปที่ **Project Settings → Environment Variables**
3. เพิ่มแต่ละตัวแปร:
   - Key: ชื่อตัวแปร (เช่น `NEXTAUTH_SECRET`)
   - Value: ค่าของตัวแปร
   - Environment: เลือก **Production, Preview, Development**
4. กด **Save**

---

## 🔄 Post-Deployment

### 1. Redeploy หลังตั้งค่า Env Vars

```bash
# ผ่าน Vercel Dashboard
Deployments → ... → Redeploy

# หรือผ่าน CLI
vercel --prod
```

### 2. สร้าง Admin User (ครั้งเดียว)

เปิดเบราว์เซอร์ไปที่:

```
https://your-app.vercel.app/api/init-admin
```

คุณจะเห็นข้อความ:

```json
{
  "message": "Admin user created successfully",
  "user": {
    "email": "admin@yourdomain.com",
    "name": "Admin Name",
    "role": "admin"
  }
}
```

### 3. ลบ Admin Environment Variables

**⚠️ สำคัญมาก:** หลังจากสร้าง admin user แล้ว ให้ลบตัวแปรเหล่านี้ออก:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `ADMIN_PHONE`

จากนั้น **Redeploy** อีกครั้ง

### 4. เข้าใช้งาน

1. ไปที่ `https://your-app.vercel.app`
2. Login ด้วย admin credentials
3. เริ่มใช้งานระบบ

### 5. เปลี่ยน Admin Password

**แนะนำให้เปลี่ยนรหัสผ่าน admin ทันทีหลัง login ครั้งแรก**

---

## 🔧 Configuration Files

### 📄 vercel.json

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

**Regions:**
- `sin1` - Singapore (เร็วสำหรับเอเชียตะวันออกเฉียงใต้)
- เปลี่ยนได้ตามต้องการ: `hnd1` (Tokyo), `hkg1` (Hong Kong)

### 📄 next.config.ts

Config ได้ปรับให้เหมาะกับ Vercel:
- ✅ Standalone output
- ✅ Security headers
- ✅ Image optimization
- ✅ Compression enabled

---

## 🌐 Custom Domain (Optional)

### เพิ่ม Custom Domain

1. ไปที่ **Project Settings → Domains**
2. เพิ่ม domain ของคุณ (เช่น `billmate.yourdomain.com`)
3. ตั้งค่า DNS ตามคำแนะนำของ Vercel
4. อัพเดท environment variables:
   ```env
   NEXTAUTH_URL=https://billmate.yourdomain.com
   NEXTAUTH_INTERNAL_URL=https://billmate.yourdomain.com
   NEXT_PUBLIC_APP_URL=https://billmate.yourdomain.com
   ```
5. Redeploy

---

## 🐛 Troubleshooting

### ❌ Build Failed

**ตรวจสอบ:**

```bash
# ทดสอบ build local
npm run build

# ตรวจสอบ dependencies
npm install

# ดู build logs ใน Vercel Dashboard
```

**สาเหตุที่พบบ่อย:**
- TypeScript errors
- Missing dependencies
- Environment variables ไม่ครบ

### ❌ Database Connection Error

**Error:** `MongoServerError: bad auth`

**แก้ไข:**
1. ตรวจสอบ `MONGODB_URI` ให้ถูกต้อง
2. ตรวจสอบ username/password
3. MongoDB Atlas → Network Access → Add IP: `0.0.0.0/0`
4. ตรวจสอบว่า Database User มีสิทธิ์เข้าถึง database

### ❌ Email Not Sending

**Error:** `Invalid login credentials`

**แก้ไข:**
1. ต้องใช้ **App Password** (16 ตัวอักษร) ไม่ใช่รหัสผ่านปกติ
2. เปิด 2-Factor Authentication ใน Google Account
3. สร้าง App Password ใหม่ที่ https://myaccount.google.com/apppasswords
4. อัพเดท `EMAIL_PASSWORD` ใน Vercel
5. Redeploy

### ❌ NextAuth Error / Cannot Login

**Error:** `[next-auth][error][SIGNIN_ERROR]`

**แก้ไข:**
1. ตรวจสอบ `NEXTAUTH_URL` ต้องตรงกับ deployment URL
2. ตรวจสอบ `NEXTAUTH_SECRET` ต้องมีความยาว 32+ characters
3. สร้าง secret ใหม่:
   ```bash
   openssl rand -base64 32
   ```
4. อัพเดทใน Vercel และ Redeploy

### ❌ Environment Variables Not Working

**แก้ไข:**
1. **ต้อง Redeploy ทุกครั้ง** หลังเปลี่ยน env vars
2. ตรวจสอบว่าเลือก Environment ถูกต้อง (Production)
3. ตรวจสอบชื่อตัวแปรไม่มี typo
4. ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะถูก expose ไปที่ client-side

### ❌ Function Invocation Timeout

**Error:** `Task timed out after 10.00 seconds`

**แก้ไข:**
1. Vercel Free tier มี timeout limit 10 วินาที
2. Upgrade เป็น Pro plan สำหรับ timeout 60 วินาที
3. ปรับโค้ดให้ทำงานเร็วขึ้น (optimize queries, caching)

### ❌ File Upload Issues

**Error:** `File too large` or files disappear

**แก้ไข:**
1. Vercel Serverless Functions มี limit:
   - Request body: 4.5 MB (Free), 100 MB (Pro)
   - Response: 4.5 MB (Free), 100 MB (Pro)
2. แนะนำใช้ **AWS S3** สำหรับเก็บไฟล์:
   ```env
   USE_CLOUD_STORAGE=true
   AWS_S3_REGION=ap-southeast-1
   AWS_S3_BUCKET_NAME=your-bucket
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   ```

---

## 📊 Monitoring & Analytics

### Vercel Analytics

เปิดใช้งาน Analytics:
1. ไปที่ Project → Analytics
2. Enable Web Analytics
3. ดู real-time performance metrics

### Function Logs

ดู logs สำหรับ debug:
1. Deployments → เลือก deployment
2. Functions → เลือก function
3. ดู Invocation logs

### Performance Monitoring

- Response time
- Error rate
- Cache hit ratio
- Bandwidth usage

---

## 🔒 Security Best Practices

### ✅ Checklist

- [ ] ใช้ strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] เปลี่ยน admin password หลัง first login
- [ ] ลบ admin env vars หลังสร้าง admin
- [ ] ใช้ App Password สำหรับ email
- [ ] ตั้งค่า MongoDB Network Access
- [ ] เปิดใช้ HTTPS only (Vercel default)
- [ ] ตรวจสอบ CORS policies
- [ ] ไม่ commit `.env.local` ขึ้น Git
- [ ] ใช้ Environment Variables ใน Vercel (ไม่ hardcode)
- [ ] Enable Vercel Authentication (optional)

### 🔐 Rate Limiting

Rate limiting ทำงานที่ API route level (ไม่ใช่ middleware)

### 🛡️ Security Headers

Security headers ถูกตั้งค่าใน:
- [next.config.ts](next.config.ts) - สำหรับ static headers
- [src/middleware.ts](src/middleware.ts) - สำหรับ dynamic headers

---

## 📚 Additional Resources

### Documentation

- [Full Deployment Guide](./DEPLOYMENT.md) - คู่มือฉบับเต็ม
- [Quick Start Guide](./VERCEL_QUICK_START.md) - คู่มือฉบับย่อ
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

### Support

- Vercel Community: https://github.com/vercel/vercel/discussions
- Next.js Discord: https://nextjs.org/discord
- MongoDB Community: https://community.mongodb.com/

---

## 🎉 Success!

หากทุกอย่างผ่าน คุณควรจะสามารถ:

✅ เข้าถึงแอพได้ที่ `https://your-app.vercel.app`
✅ Login ด้วย admin credentials
✅ สร้างห้อง, ผู้เช่า, บิล
✅ อัพโหลดใบเสร็จ
✅ ส่งอีเมล์แจ้งเตือน
✅ ดูรายงานและสถิติ

---

**Happy deploying! 🚀**

หากมีปัญหาหรือคำถาม สามารถดู [Troubleshooting](#-troubleshooting) หรือ [DEPLOYMENT.md](./DEPLOYMENT.md)
