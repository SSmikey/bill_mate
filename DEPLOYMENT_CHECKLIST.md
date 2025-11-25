# ✅ Vercel Deployment Checklist

## 📋 Pre-Deployment

### MongoDB Atlas
- [ ] สร้าง MongoDB Atlas account
- [ ] สร้าง Free Cluster (M0)
- [ ] สร้าง Database User (username/password)
- [ ] ตั้งค่า Network Access: `0.0.0.0/0`
- [ ] คัดลอก Connection String
- [ ] ทดสอบ connection string ใน local

### Email Setup (Gmail)
- [ ] เปิด 2-Factor Authentication
- [ ] สร้าง App Password ที่ Google Account Security
- [ ] บันทึก App Password (16 characters)
- [ ] ทดสอบส่งอีเมล์ใน local

### Git Repository
- [ ] Push code ขึ้น GitHub
- [ ] ตรวจสอบ `.gitignore` มี `.env.local`
- [ ] ไม่มีไฟล์ sensitive data ใน repo
- [ ] ทดสอบ `npm run build` ใน local สำเร็จ

---

## 🚀 Deployment

### Vercel Setup
- [ ] สร้าง Vercel account
- [ ] เชื่อมต่อ GitHub กับ Vercel
- [ ] Import project จาก GitHub
- [ ] เลือก Framework: **Next.js**
- [ ] Root Directory: `./`
- [ ] ยอมรับ default build settings

### Initial Deploy
- [ ] กด Deploy (ยังไม่ต้องใส่ env vars)
- [ ] บันทึก Deployment URL (เช่น `https://bill-mate.vercel.app`)

---

## 🔐 Environment Variables

### สร้าง Secrets

```bash
# NEXTAUTH_SECRET
# Mac/Linux:
openssl rand -base64 32

# Windows PowerShell:
[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))
```

- [ ] สร้าง `NEXTAUTH_SECRET` และบันทึก

### ตั้งค่าใน Vercel

ไปที่ **Project Settings → Environment Variables**

#### 1. Application Settings
- [ ] `NODE_ENV` = `production`
- [ ] `PROTOCOL` = `https`

#### 2. NextAuth
- [ ] `NEXTAUTH_URL` = `https://your-app.vercel.app`
- [ ] `NEXTAUTH_INTERNAL_URL` = `https://your-app.vercel.app`
- [ ] `NEXTAUTH_SECRET` = `<generated-secret>`

#### 3. MongoDB
- [ ] `MONGODB_URI` = `mongodb+srv://...`
- [ ] `MONGODB_DB` = `billmate`

#### 4. Email
- [ ] `EMAIL_HOST` = `smtp.gmail.com`
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_USER` = `your-email@gmail.com`
- [ ] `EMAIL_PASSWORD` = `<16-char-app-password>`
- [ ] `EMAIL_FROM_NAME` = `ระบบหอพัก`

#### 5. App URLs
- [ ] `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`
- [ ] `CONTACT_EMAIL` = `admin@yourdomain.com`

#### 6. Admin Setup (ครั้งแรกอย่างเดียว)
- [ ] `ADMIN_EMAIL` = `admin@yourdomain.com`
- [ ] `ADMIN_PASSWORD` = `<strong-password>`
- [ ] `ADMIN_NAME` = `Admin Name`
- [ ] `ADMIN_PHONE` = `+66812345678`

#### 7. Optional (ถ้าใช้)
- [ ] `USE_CLOUD_STORAGE` = `false` (หรือ `true` ถ้าใช้ S3)
- [ ] AWS S3 credentials (ถ้าใช้)
- [ ] `APP_NAME` = `Bill Mate`
- [ ] `CRON_SECRET` = `<random-secret>`

### ตรวจสอบ
- [ ] Environment ทุกตัวเลือก: **Production, Preview, Development**
- [ ] บันทึกทุกตัวแปรแล้ว
- [ ] ไม่มี typo ในชื่อตัวแปร

---

## 🔄 Redeploy

### After Setting Env Vars
- [ ] ไปที่ **Deployments**
- [ ] กด **Redeploy** บน latest deployment
- [ ] รอจน deployment สำเร็จ (สีเขียว ✓)
- [ ] ตรวจสอบ build logs ไม่มี critical errors

---

## 👤 Admin User Setup

### สร้าง Admin
- [ ] เปิดเบราว์เซอร์ไปที่: `https://your-app.vercel.app/api/init-admin`
- [ ] ได้ response: `{"message": "Admin user created successfully"}`
- [ ] **ไม่มี error**

### ลบ Admin Env Vars
- [ ] ไปที่ **Project Settings → Environment Variables**
- [ ] ลบ `ADMIN_EMAIL`
- [ ] ลบ `ADMIN_PASSWORD`
- [ ] ลบ `ADMIN_NAME`
- [ ] ลบ `ADMIN_PHONE`
- [ ] กด **Redeploy** อีกครั้ง

---

## ✅ Post-Deployment Testing

### Login Test
- [ ] ไปที่ `https://your-app.vercel.app`
- [ ] หน้า login โหลดได้
- [ ] Login ด้วย admin email/password สำเร็จ
- [ ] เข้าสู่ Admin Dashboard

### Basic Functionality
- [ ] สร้างห้องได้
- [ ] สร้างผู้เช่าได้
- [ ] สร้างบิลได้
- [ ] อัพโหลดรูปภาพได้
- [ ] ดูรายงานได้

### Email Test
- [ ] ส่งอีเมล์ทดสอบได้
- [ ] ได้รับอีเมล์
- [ ] ลิงก์ในอีเมล์ทำงาน

### Performance
- [ ] หน้าโหลดเร็ว (< 3 วินาที)
- [ ] ไม่มี console errors
- [ ] ไม่มี 500 errors

---

## 🔒 Security

### Security Checks
- [ ] เปลี่ยน admin password หลัง first login
- [ ] ลบ admin env vars แล้ว
- [ ] ไม่มี `.env.local` ใน Git
- [ ] ใช้ App Password สำหรับ email
- [ ] MongoDB Network Access ตั้งค่าถูกต้อง
- [ ] HTTPS ทำงาน (Vercel default)
- [ ] Security headers ทำงาน (check ใน Network tab)

---

## 📊 Monitoring Setup

### Vercel Analytics (Optional)
- [ ] เปิด Web Analytics
- [ ] ตรวจสอบ metrics ทำงาน
- [ ] ตั้งค่า alerts (optional)

### Error Tracking
- [ ] ตรวจสอบ Function logs
- [ ] ไม่มี repeated errors
- [ ] Set up error notifications (optional)

---

## 🌐 Custom Domain (Optional)

### Domain Setup
- [ ] เพิ่ม custom domain ใน Vercel
- [ ] ตั้งค่า DNS records
- [ ] รอ DNS propagation (may take up to 48 hours)
- [ ] ทดสอบเข้าถึงได้ผ่าน custom domain

### Update Env Vars
- [ ] อัพเดท `NEXTAUTH_URL` เป็น custom domain
- [ ] อัพเดท `NEXTAUTH_INTERNAL_URL` เป็น custom domain
- [ ] อัพเดท `NEXT_PUBLIC_APP_URL` เป็น custom domain
- [ ] Redeploy

---

## 📚 Documentation

### ให้แน่ใจว่ามี:
- [ ] `README_VERCEL.md` - คู่มือหลัก
- [ ] `VERCEL_QUICK_START.md` - คู่มือฉบับย่อ
- [ ] `DEPLOYMENT.md` - คู่มือฉบับเต็ม
- [ ] `.env.production.example` - ตัวอย่าง env vars
- [ ] `vercel.json` - Vercel config
- [ ] `.vercelignore` - ไฟล์ที่ไม่ต้อง deploy

---

## 🎯 Final Checks

### Pre-Production
- [ ] ทดสอบทุก features ทำงาน
- [ ] ไม่มี critical bugs
- [ ] Performance ดี
- [ ] Security ตั้งค่าถูกต้อง
- [ ] Backup plan มี (MongoDB backups)

### Go Live
- [ ] แจ้งผู้ใช้เกี่ยวกับ URL ใหม่
- [ ] ให้คู่มือการใช้งาน
- [ ] ตั้ง monitoring และ alerts
- [ ] เตรียม support channel

---

## 🆘 Rollback Plan

หากเกิดปัญหา:

- [ ] มี backup ของ database
- [ ] รู้วิธี rollback deployment ใน Vercel
- [ ] มี local version ที่ทำงานได้
- [ ] มีข้อมูล contact สำหรับ support

---

## ✨ Success Criteria

### ถือว่าสำเร็จเมื่อ:

✅ Deploy สำเร็จโดยไม่มี errors
✅ Login ได้ด้วย admin credentials
✅ สร้างและจัดการ rooms, tenants, bills ได้
✅ Upload และแสดงรูปภาพได้
✅ ส่งอีเมล์ได้
✅ Performance ดี (< 3s page load)
✅ ไม่มี security warnings
✅ Admin password เปลี่ยนแล้ว
✅ Admin env vars ลบออกแล้ว

---

**🎉 Congratulations! Your Bill Mate app is now live on Vercel!**

**Production URL:** `https://your-app.vercel.app`

**Next Steps:**
1. Monitor performance และ errors
2. Collect user feedback
3. Plan for updates และ improvements
4. Set up regular database backups
5. Consider upgrading to Vercel Pro for more features

---

**Need help?** Check:
- [README_VERCEL.md](./README_VERCEL.md) - Full documentation
- [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md) - Quick guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
