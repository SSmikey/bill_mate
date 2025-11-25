# 🚀 การ Deploy Bill Mate ขึ้น Vercel

## ขั้นตอนการ Deploy

### 1. เตรียม MongoDB Atlas

1. สร้าง account ที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Cluster (ฟรี)
3. เพิ่ม IP whitelist: `0.0.0.0/0` (allow all) สำหรับ production
4. สร้าง Database User และเก็บ username/password
5. คัดลอก Connection String (MongoDB URI)

### 2. เตรียม Email Service

**สำหรับ Gmail:**
1. เปิด 2-Factor Authentication
2. สร้าง App Password ที่ [Google Account Security](https://myaccount.google.com/security)
3. เก็บ App Password ไว้

### 3. Deploy ขึ้น Vercel

#### ทางเลือก A: Deploy ผ่าน Vercel Dashboard (แนะนำ)

1. ไปที่ [Vercel](https://vercel.com)
2. Sign in ด้วย GitHub
3. กด **"Import Project"**
4. เลือก repository `bill_mate`
5. Configure Project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

#### ทางเลือก B: Deploy ผ่าน Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 4. ตั้งค่า Environment Variables ใน Vercel

ไปที่ **Project Settings → Environment Variables** แล้วเพิ่มตัวแปรเหล่านี้:

#### Required Variables

```env
# Application
NODE_ENV=production
PROTOCOL=https

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_INTERNAL_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<สร้างด้วย: openssl rand -base64 32>

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/billmate?retryWrites=true&w=majority
MONGODB_DB=billmate

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=<App Password จาก Google>
EMAIL_FROM_NAME=ระบบหอพัก

# App URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CONTACT_EMAIL=admin@yourdomain.com

# Admin (ใช้ครั้งเดียวตอน setup)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<รหัสผ่านที่แข็งแรง>
ADMIN_NAME=Admin Name
ADMIN_PHONE=+66812345678
```

#### Optional Variables

```env
# Cloud Storage (ถ้าใช้ AWS S3)
USE_CLOUD_STORAGE=false
AWS_S3_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Additional Settings
APP_NAME=Bill Mate
CRON_SECRET=<random-secret>
```

### 5. สร้าง Admin User (ครั้งแรก)

หลังจาก deploy สำเร็จแล้ว:

1. เข้าไปที่: `https://your-app.vercel.app/api/init-admin`
2. จะได้ response แจ้งว่าสร้าง admin สำเร็จ
3. **ลบหรือ comment environment variables สำหรับ admin ออก**:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_NAME`
   - `ADMIN_PHONE`

### 6. ทดสอบ

1. เข้าใช้งานที่ `https://your-app.vercel.app`
2. Login ด้วย admin credentials
3. ทดสอบฟีเจอร์ต่างๆ:
   - สร้างห้อง
   - เพิ่มผู้เช่า
   - อัพโหลดใบเสร็จ
   - ส่งอีเมล์แจ้งเตือน

## 🔧 Configuration Tips

### Custom Domain

1. ไปที่ **Project Settings → Domains**
2. เพิ่ม custom domain ของคุณ
3. อัพเดท `NEXTAUTH_URL` และ `NEXT_PUBLIC_APP_URL` ให้ตรงกับ domain ใหม่

### Regional Settings

- Vercel config ตั้งค่า region เป็น `sin1` (Singapore) เพื่อความเร็วในเอเชียตะวันออกเฉียงใต้
- สามารถเปลี่ยนได้ใน [vercel.json](vercel.json)

### การจัดเก็บไฟล์

**Local Storage (Default):**
- ไฟล์เก็บใน Vercel serverless functions
- มีข้อจำกัดเรื่อง storage และ lifecycle

**AWS S3 (แนะนำสำหรับ Production):**
1. สร้าง S3 bucket ที่ [AWS Console](https://console.aws.amazon.com/s3)
2. ตั้งค่า CORS และ permissions
3. สร้าง IAM user ที่มี S3 access
4. เพิ่ม environment variables สำหรับ S3
5. ตั้งค่า `USE_CLOUD_STORAGE=true`

## 🐛 Troubleshooting

### Build Error

```bash
# ตรวจสอบ TypeScript errors
npm run build

# ตรวจสอบ dependencies
npm install
```

### Database Connection Error

- ตรวจสอบ MongoDB URI
- ตรวจสอบ IP whitelist ใน MongoDB Atlas
- ตรวจสอบว่า Network Access อนุญาต `0.0.0.0/0`

### Email Not Sending

- ตรวจสอบ App Password
- ตรวจสอบว่า 2FA เปิดอยู่
- ตรวจสอบ email logs ใน Vercel dashboard

### Environment Variables Not Working

- กด **Redeploy** หลังจากเปลี่ยน env vars
- ตรวจสอบว่าใช้ชื่อตัวแปรถูกต้อง
- ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะถูก expose ไปที่ client-side

## 📊 Monitoring

### Vercel Analytics

- เปิดใช้งาน Analytics ใน Project Settings
- ดู performance metrics และ usage

### Logs

- ดู Function logs ที่ **Deployments → Functions**
- ใช้สำหรับ debug errors

### Cron Jobs (Optional)

สำหรับ scheduled tasks (เช่น การส่งอีเมล์อัตโนมัติ):

1. ใช้ [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
2. หรือใช้บริการภายนอกเช่น [Cron-job.org](https://cron-job.org)
3. เรียก API endpoint ที่ `/api/cron/[task-name]`

## 🔒 Security Checklist

- ✅ ใช้ strong `NEXTAUTH_SECRET` (min 32 characters)
- ✅ เปลี่ยน admin password หลัง first login
- ✅ ลบ admin env vars หลังสร้าง admin เสร็จ
- ✅ ใช้ App Password สำหรับ email (ไม่ใช่รหัสผ่านหลัก)
- ✅ ตั้งค่า MongoDB Network Access อย่างเหมาะสม
- ✅ เปิดใช้ HTTPS only
- ✅ ตั้งค่า CORS policies ให้เหมาะสม

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

## 🆘 Support

หากมีปัญหาในการ deploy:

1. ตรวจสอบ Vercel build logs
2. ตรวจสอบ Function logs
3. ตรวจสอบ environment variables
4. ทดสอบ local ด้วย `npm run build && npm start`
