# 🚀 Vercel Quick Start Guide

## ⚡ ขั้นตอนย่อ Deploy ขึ้น Vercel

### 1️⃣ เตรียม MongoDB (5 นาที)

1. สร้าง account ฟรีที่ https://www.mongodb.com/cloud/atlas
2. สร้าง Cluster (เลือก Free Tier)
3. Database Access → Add New User → สร้าง username/password
4. Network Access → Add IP Address → เลือก `0.0.0.0/0` (Allow from anywhere)
5. คัดลอก Connection String (กด Connect → Drivers)

**Connection String ตัวอย่าง:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/billmate?retryWrites=true&w=majority
```

### 2️⃣ เตรียม Email (Gmail) (3 นาที)

1. เปิด Google Account → Security
2. เปิด 2-Step Verification
3. ไปที่ App Passwords → สร้าง password ใหม่
4. เก็บ 16-character password ไว้

### 3️⃣ Deploy ขึ้น Vercel (2 นาที)

#### Option A: ผ่าน GitHub (แนะนำ)

1. Push code ขึ้น GitHub repository
2. ไปที่ https://vercel.com
3. Sign in ด้วย GitHub
4. กด **Import Project**
5. เลือก repository `bill_mate`
6. กด **Deploy** (ยังไม่ต้องตั้ง env vars)

#### Option B: ผ่าน Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

### 4️⃣ ตั้งค่า Environment Variables (5 นาที)

ไปที่ Vercel Dashboard → Project → Settings → Environment Variables

**คัดลอกและแก้ไขตามความเหมาะสม:**

```env
# 1. NextAuth (สร้าง secret)
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_INTERNAL_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-secret-here-min-32-chars

# 2. MongoDB (จากขั้นตอนที่ 1)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/billmate?retryWrites=true&w=majority
MONGODB_DB=billmate

# 3. Email (จากขั้นตอนที่ 2)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM_NAME=ระบบหอพัก

# 4. App URLs
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
CONTACT_EMAIL=admin@yourdomain.com

# 5. Admin Setup (ใช้ครั้งเดียว)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_NAME=Admin Name
ADMIN_PHONE=+66812345678

# 6. Other
NODE_ENV=production
PROTOCOL=https
USE_CLOUD_STORAGE=false
```

**สร้าง NEXTAUTH_SECRET:**

```bash
# Mac/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**หมายเหตุ:** ตั้งค่าทุกตัวแปรให้ใช้กับ **Production, Preview, Development**

### 5️⃣ Redeploy (1 นาที)

1. Vercel Dashboard → Deployments
2. กด **Redeploy** (เพื่อให้ env vars มีผล)
3. รอจน deployment สำเร็จ

### 6️⃣ สร้าง Admin User (30 วินาที)

1. เปิดเบราว์เซอร์ไปที่:
   ```
   https://your-project.vercel.app/api/init-admin
   ```

2. ควรเห็นข้อความ:
   ```json
   {"message": "Admin user created successfully"}
   ```

3. **ลบ Environment Variables เหล่านี้ออก:**
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_NAME`
   - `ADMIN_PHONE`

4. Redeploy อีกครั้ง

### 7️⃣ เข้าใช้งาน ✅

1. ไปที่ `https://your-project.vercel.app`
2. Login ด้วย admin email/password ที่ตั้งไว้
3. เริ่มใช้งาน!

---

## 📋 Checklist

- [ ] สร้าง MongoDB Cluster
- [ ] ได้ MongoDB Connection String
- [ ] สร้าง Gmail App Password
- [ ] Deploy project ขึ้น Vercel
- [ ] ตั้งค่า Environment Variables ครบทั้งหมด
- [ ] Redeploy เพื่อให้ env vars มีผล
- [ ] เรียก `/api/init-admin` เพื่อสร้าง admin
- [ ] ลบ admin env vars ออก
- [ ] Redeploy อีกครั้ง
- [ ] ทดสอบ login เข้าระบบ

---

## 🐛 แก้ปัญหา

### Build Error

```bash
# ทดสอบ build local ก่อน
npm run build
```

### Cannot connect to database

- ตรวจสอบ `MONGODB_URI` ให้ถูกต้อง
- ตรวจสอบ MongoDB Network Access ต้องมี `0.0.0.0/0`
- ตรวจสอบ username/password ใน connection string

### Email not sending

- ตรวจสอบว่าใช้ App Password (16 ตัวอักษร) ไม่ใช่รหัสผ่านหลัก
- ตรวจสอบว่า 2FA เปิดอยู่
- ตรวจสอบ `EMAIL_USER` และ `EMAIL_PASSWORD`

### Cannot login / 404 on login

- ตรวจสอบ `NEXTAUTH_URL` ต้องตรงกับ URL ของ Vercel app
- ตรวจสอบ `NEXTAUTH_SECRET` ต้องมีความยาวอย่างน้อย 32 characters
- Redeploy หลังจากเปลี่ยน env vars

### Environment variables not working

- ต้อง **Redeploy** ทุกครั้งหลังเปลี่ยน env vars
- ตรวจสอบว่าตั้งค่าให้กับ Environment ที่ถูกต้อง (Production)

---

## 🔐 Security Tips

✅ เปลี่ยน admin password ทันทีหลัง login ครั้งแรก
✅ ลบ admin env vars หลังสร้าง admin เสร็จ
✅ ใช้ App Password สำหรับ email (ไม่ใช่รหัสผ่านจริง)
✅ ใช้ strong NEXTAUTH_SECRET (32+ characters)
✅ ไม่ commit `.env.local` ขึ้น Git

---

## 📚 เอกสารเพิ่มเติม

- [DEPLOYMENT.md](./DEPLOYMENT.md) - คู่มือโดยละเอียด
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ⏱️ รวมเวลาทั้งหมด: ~15-20 นาที

Happy deploying! 🎉
