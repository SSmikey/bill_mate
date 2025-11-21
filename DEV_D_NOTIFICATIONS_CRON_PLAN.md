# Dev D: Notifications & Cron Jobs - แผนการพัฒนา

## 🎯 เป้าหมาย
สร้างระบบแจ้งเตือนอัตโนมัติและ Cron Jobs สำหรับส่งการแจ้งเตือนการชำระเงินตามกำหนดเวลา

---

## 📋 สิ่งที่มีอยู่แล้ว (Foundation Ready ✓)

### ✅ Notification API Endpoints (Complete)
- `GET /api/notifications` - ดึงรายการ notifications ของ user
- `POST /api/notifications` - Mark as read
- `POST /api/notifications/send` - Admin trigger notifications manually
  - Types: `reminder_5days`, `reminder_1day`, `overdue`

### ✅ MongoDB Notification Model
```typescript
{
  userId: ObjectId;              // ผู้รับ notification
  type: 'payment_reminder' | 'payment_verified' |
        'payment_rejected' | 'bill_generated' | 'overdue';
  title: string;                 // หัวข้อภาษาไทย
  message: string;               // ข้อความภาษาไทย
  billId?: ObjectId;             // บิลที่เกี่ยวข้อง
  read: boolean;                 // อ่านแล้วหรือยัง (default: false)
  sentAt: Date;                  // วันที่ส่ง
  readAt?: Date;                 // วันที่อ่าน
  createdAt: Date;
  updatedAt: Date;
}
```

### ✅ Notification Service Functions
**Location:** `src/services/notificationService.ts`

1. **sendPaymentReminders(daysBefore)**
   - หาบิลที่ครบกำหนดในอีก X วัน
   - สร้าง notification + ส่ง email
   - Return: จำนวน notifications ที่ส่ง

2. **sendPaymentOverdueNotifications()**
   - หาบิลที่เลยกำหนดชำระแล้ว
   - สร้าง notification (in-app only)
   - ส่งได้ครั้งละ 1 notification ต่อ 24 ชั่วโมง

3. **notifyPaymentVerified()**
   - แจ้งเตือนเมื่อ admin อนุมัติการชำระ
   - ส่งทั้ง in-app + email

4. **notifyPaymentRejected()**
   - แจ้งเตือนเมื่อ admin ปฏิเสธการชำระ
   - ส่งทั้ง in-app + email พร้อมเหตุผล

### ✅ Email Service
**Location:** `src/lib/email.ts`

**Setup:**
- Nodemailer + Gmail SMTP
- Env vars: `EMAIL_USER`, `EMAIL_PASS`

**Email Templates (HTML):**
- `getPaymentReminderEmail()` - แจ้งเตือนครบกำหนดชำระ
- `getPaymentVerifiedEmail()` - การชำระได้รับการอนุมัติ
- `getPaymentRejectedEmail()` - การชำระถูกปฏิเสธ

### ✅ Navbar Notification UI
**Location:** `src/app/components/Navbar.tsx`

**Features:**
- Bell icon พร้อม unread count badge
- Dropdown แสดง notifications ล่าสุด
- Mark as read ได้เมื่อคลิก
- Link ไป `/notifications` (หน้ายังไม่มี)
- Auto-refresh ทุก 60 วินาที (polling)

---

## 🔨 สิ่งที่ต้องสร้าง

### 1. **Cron Job System** ⭐ (Priority 1)

#### ติดตั้ง Dependencies:
```bash
npm install node-cron
npm install -D @types/node-cron
```

#### สร้าง Cron Service
**ไฟล์:** `src/services/cronService.ts`

**Scheduled Jobs:**
```typescript
import cron from 'node-cron';
import {
  sendPaymentReminders,
  sendPaymentOverdueNotifications
} from './notificationService';

// Job 1: ส่ง reminder 5 วันก่อนครบกำหนด
// ทำงานทุกวันเวลา 09:00
export function startPaymentReminder5Days() {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running: 5-day payment reminder');
    try {
      const count = await sendPaymentReminders(5);
      console.log(`Sent ${count} payment reminders (5 days)`);
    } catch (error) {
      console.error('Error in 5-day reminder job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
}

// Job 2: ส่ง reminder 1 วันก่อนครบกำหนด
// ทำงานทุกวันเวลา 18:00
export function startPaymentReminder1Day() {
  cron.schedule('0 18 * * *', async () => {
    console.log('Running: 1-day payment reminder');
    try {
      const count = await sendPaymentReminders(1);
      console.log(`Sent ${count} payment reminders (1 day)`);
    } catch (error) {
      console.error('Error in 1-day reminder job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
}

// Job 3: ส่ง overdue notifications
// ทำงานทุกวันเวลา 10:00
export function startOverdueNotifications() {
  cron.schedule('0 10 * * *', async () => {
    console.log('Running: Overdue payment notifications');
    try {
      const count = await sendPaymentOverdueNotifications();
      console.log(`Sent ${count} overdue notifications`);
    } catch (error) {
      console.error('Error in overdue notification job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
}

// Job 4: Cleanup old notifications
// ทำงานทุกวันอาทิตย์เวลา 01:00
export function startNotificationCleanup() {
  cron.schedule('0 1 * * 0', async () => {
    console.log('Running: Notification cleanup');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        read: true,
        readAt: { $lt: thirtyDaysAgo }
      });

      console.log(`Deleted ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('Error in cleanup job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
}

// Initialize all cron jobs
export function initializeCronJobs() {
  console.log('Initializing cron jobs...');
  startPaymentReminder5Days();
  startPaymentReminder1Day();
  startOverdueNotifications();
  startNotificationCleanup();
  console.log('All cron jobs initialized');
}
```

#### Cron Schedule Patterns:
```
Format: * * * * *
        │ │ │ │ │
        │ │ │ │ └─── Day of week (0-7) (Sunday = 0 or 7)
        │ │ │ └──── Month (1-12)
        │ │ └───── Day of month (1-31)
        │ └────── Hour (0-23)
        └─────── Minute (0-59)

Examples:
'0 9 * * *'      - Every day at 09:00
'0 18 * * *'     - Every day at 18:00
'0 */6 * * *'    - Every 6 hours
'*/30 * * * *'   - Every 30 minutes
'0 1 * * 0'      - Every Sunday at 01:00
'0 0 1 * *'      - 1st of every month at midnight
```

#### เริ่มต้น Cron Jobs
**ไฟล์:** `src/app/api/cron/init/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { initializeCronJobs } from '@/services/cronService';

let cronJobsInitialized = false;

export async function GET() {
  if (!cronJobsInitialized) {
    initializeCronJobs();
    cronJobsInitialized = true;
    return NextResponse.json({
      success: true,
      message: 'Cron jobs initialized'
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Cron jobs already running'
  });
}
```

**หรือเริ่มใน middleware/layout:**
```typescript
// src/app/layout.tsx
import { initializeCronJobs } from '@/services/cronService';

// Initialize cron jobs on server startup
if (typeof window === 'undefined') {
  initializeCronJobs();
}
```

---

### 2. **Notifications Page (User View)** ⭐ (Priority 1)
**ไฟล์:** `src/app/notifications/page.tsx`

#### หน้าที่:
- แสดงรายการ notifications ทั้งหมด
- Filter ตามประเภทและสถานะ
- Mark as read / Mark all as read
- Delete notifications
- Link ไปยังบิลที่เกี่ยวข้อง

#### Layout:
```
┌──────────────────────────────────────────────────────┐
│ การแจ้งเตือนของฉัน                                   │
├──────────────────────────────────────────────────────┤
│ Filter: [ทั้งหมด] [ยังไม่อ่าน] [อ่านแล้ว]          │
│ Type: [ทั้งหมด] [เตือนการชำระ] [อนุมัติ] [ปฏิเสธ]  │
│                                    [ลบที่อ่านแล้ว]   │
├──────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────┐  │
│ │ 🔔 [NEW] แจ้งเตือนการชำระเงิน 5 วัน           │  │
│ │ กรุณาชำระค่าเช่าห้อง 101 จำนวน 3,000 บาท    │  │
│ │ ภายในวันที่ 25/11/2567                        │  │
│ │ วันที่: 21/11/2567 09:00  [ดูบิล] [ลบ]       │  │
│ └────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────┐  │
│ │ ✅ การชำระได้รับการอนุมัติแล้ว                │  │
│ │ การชำระค่าเช่าห้อง 101 เดือนตุลาคม           │  │
│ │ จำนวน 3,000 บาท ได้รับการยืนยันแล้ว          │  │
│ │ วันที่: 20/11/2567 14:30  [ดูบิล] [ลบ]       │  │
│ └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

#### State Management:
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
const [loading, setLoading] = useState(true);
```

#### Features:
```typescript
// Fetch notifications
async function fetchNotifications() {
  const response = await fetch('/api/notifications');
  const result = await response.json();
  setNotifications(result.data.notifications);
}

// Mark single as read
async function markAsRead(notificationId: string) {
  await fetch('/api/notifications', {
    method: 'POST',
    body: JSON.stringify({ notificationId })
  });
  fetchNotifications();
}

// Mark all as read
async function markAllAsRead() {
  const unreadIds = notifications
    .filter(n => !n.read)
    .map(n => n._id);

  for (const id of unreadIds) {
    await markAsRead(id);
  }
}

// Delete notification
async function deleteNotification(id: string) {
  await fetch(`/api/notifications/${id}`, {
    method: 'DELETE'
  });
  fetchNotifications();
}

// Delete all read
async function deleteAllRead() {
  const readIds = notifications.filter(n => n.read).map(n => n._id);

  for (const id of readIds) {
    await deleteNotification(id);
  }
}
```

#### Notification Card Component:
```tsx
interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationCard({ notification, onMarkRead, onDelete }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'payment_reminder': return '🔔';
      case 'payment_verified': return '✅';
      case 'payment_rejected': return '❌';
      case 'overdue': return '⚠️';
      case 'bill_generated': return '📄';
      default: return '📌';
    }
  };

  const getBgClass = () => {
    return notification.read ? 'bg-light' : 'bg-white border-primary';
  };

  return (
    <div className={`card mb-2 ${getBgClass()}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="mb-1">
              {getIcon()} {notification.read ? '' : <span className="badge bg-danger">NEW</span>}
              {' '}{notification.title}
            </h6>
            <p className="mb-2 text-muted">{notification.message}</p>
            <small className="text-muted">
              {format(new Date(notification.sentAt), 'dd/MM/yyyy HH:mm', { locale: th })}
            </small>
          </div>
          <div className="d-flex gap-2">
            {notification.billId && (
              <Link
                href={`/tenant/bills/${notification.billId}`}
                className="btn btn-sm btn-outline-primary"
              >
                ดูบิล
              </Link>
            )}
            {!notification.read && (
              <button
                className="btn btn-sm btn-outline-success"
                onClick={() => onMarkRead(notification._id)}
              >
                <i className="bi bi-check"></i>
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDelete(notification._id)}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. **Admin Notifications Management Page** ⭐ (Priority 2)
**ไฟล์:** `src/app/admin/notifications/page.tsx`

#### หน้าที่:
- ดูสถิติการส่ง notifications
- ส่ง notifications manually
- ตั้งเวลาส่ง notifications
- ดู notification logs

#### Layout:
```
┌──────────────────────────────────────────────────────┐
│ จัดการการแจ้งเตือน (Admin)                           │
├──────────────────────────────────────────────────────┤
│ Statistics:                                          │
│ ┌─────────────┬─────────────┬─────────────────────┐ │
│ │ ส่งวันนี้   │ รอตรวจสอบ  │ อัตราการอ่าน       │ │
│ │    45       │    12       │    78%              │ │
│ └─────────────┴─────────────┴─────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ Manual Triggers:                                     │
│ [ส่งแจ้งเตือน 5 วัน] [ส่งแจ้งเตือน 1 วัน] [เกินกำหนด]│
├──────────────────────────────────────────────────────┤
│ Cron Job Status:                                     │
│ • 5-day reminder: 🟢 Active (Next: 21/11 09:00)     │
│ • 1-day reminder: 🟢 Active (Next: 21/11 18:00)     │
│ • Overdue check: 🟢 Active (Next: 22/11 10:00)      │
│ • Cleanup: 🟢 Active (Next: 24/11 01:00)            │
├──────────────────────────────────────────────────────┤
│ Recent Notification Logs:                            │
│ ┌────────┬─────────┬────────┬──────────┐            │
│ │เวลา    │ประเภท   │ส่งสำเร็จ│ล้มเหลว  │            │
│ ├────────┼─────────┼────────┼──────────┤            │
│ │09:00   │5-day    │   15   │    0     │            │
│ │18:00   │1-day    │   8    │    1     │            │
│ └────────┴─────────┴────────┴──────────┘            │
└──────────────────────────────────────────────────────┘
```

#### Features:
```typescript
// Manual trigger
async function triggerNotification(type: string) {
  setLoading(true);
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });

    const result = await response.json();
    alert(`ส่งสำเร็จ ${result.data.notificationCount} รายการ`);
  } catch (error) {
    alert('เกิดข้อผิดพลาด');
  } finally {
    setLoading(false);
  }
}

// Fetch statistics
async function fetchStats() {
  const response = await fetch('/api/notifications/stats');
  const data = await response.json();
  setStats(data);
}
```

#### API สำหรับ Stats:
**ไฟล์:** `src/app/api/notifications/stats/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      sentToday,
      pending,
      totalRead,
      totalNotifications
    ] = await Promise.all([
      Notification.countDocuments({ sentAt: { $gte: today } }),
      Notification.countDocuments({ read: false }),
      Notification.countDocuments({ read: true }),
      Notification.countDocuments({})
    ]);

    const readRate = totalNotifications > 0
      ? Math.round((totalRead / totalNotifications) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        sentToday,
        pending,
        readRate,
        totalNotifications
      }
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

---

### 4. **Profile Page** (Priority 3)
**ไฟล์:** `src/app/profile/page.tsx`

#### หน้าที่:
- แสดงข้อมูลโปรไฟล์ user
- แก้ไขข้อมูลส่วนตัว (name, phone, email)
- เปลี่ยนรหัสผ่าน
- ตั้งค่า notification preferences

#### Layout:
```
┌──────────────────────────────────────────────────────┐
│ โปรไฟล์ของฉัน                                        │
├──────────────────────────────────────────────────────┤
│ ข้อมูลส่วนตัว:                                       │
│   ชื่อ: [_______________]                            │
│   อีเมล: [_______________]                           │
│   เบอร์โทร: [_______________]                        │
│   [บันทึก]                                           │
├──────────────────────────────────────────────────────┤
│ เปลี่ยนรหัสผ่าน:                                     │
│   รหัสผ่านเดิม: [_______________]                    │
│   รหัสผ่านใหม่: [_______________]                    │
│   ยืนยันรหัสผ่าน: [_______________]                  │
│   [เปลี่ยนรหัสผ่าน]                                  │
├──────────────────────────────────────────────────────┤
│ การแจ้งเตือน:                                        │
│   ☑ รับการแจ้งเตือนทางอีเมล                          │
│   ☑ แจ้งเตือนก่อนครบกำหนด 5 วัน                     │
│   ☑ แจ้งเตือนก่อนครบกำหนด 1 วัน                     │
│   ☑ แจ้งเตือนเมื่อเกินกำหนด                          │
│   [บันทึกการตั้งค่า]                                 │
└──────────────────────────────────────────────────────┘
```

---

### 5. **Notification Delete Endpoint**
**ไฟล์:** `src/app/api/notifications/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authOptions } from '@/lib/auth';

// DELETE notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find and verify ownership
    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of own notifications
    if (notification.userId.toString() !== session.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Notification.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
```

---

### 6. **Bill Auto-Generation (Optional)**
**ไฟล์:** `src/services/billService.ts`

```typescript
import connectDB from '@/lib/mongodb';
import Bill from '@/models/Bill';
import Room from '@/models/Room';
import Notification from '@/models/Notification';

// สร้างบิลอัตโนมัติสำหรับทุกห้องที่มีผู้เช่า
export async function generateMonthlyBills() {
  await connectDB();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // หาห้องที่มีผู้เช่า
  const occupiedRooms = await Room.find({ isOccupied: true })
    .populate('tenantId');

  let billsCreated = 0;

  for (const room of occupiedRooms) {
    try {
      // เช็คว่ามีบิลเดือนนี้แล้วหรือยัง
      const existingBill = await Bill.findOne({
        roomId: room._id,
        month,
        year
      });

      if (existingBill) {
        console.log(`Bill already exists for room ${room.roomNumber}`);
        continue;
      }

      // คำนวณวันครบกำหนด (วันที่ 25 ของเดือนนี้)
      const dueDate = new Date(year, month - 1, 25);

      // สร้างบิลใหม่
      const bill = await Bill.create({
        roomId: room._id,
        tenantId: room.tenantId._id,
        month,
        year,
        rentAmount: room.rentPrice,
        waterAmount: room.waterPrice,
        electricityAmount: room.electricityPrice,
        totalAmount: room.rentPrice + room.waterPrice + room.electricityPrice,
        dueDate,
        status: 'pending'
      });

      // สร้าง notification
      await Notification.create({
        userId: room.tenantId._id,
        type: 'bill_generated',
        title: `บิลเดือน ${getThaiMonth(month)} ${year + 543}`,
        message: `บิลค่าเช่าห้อง ${room.roomNumber} จำนวน ${bill.totalAmount.toLocaleString('th-TH')} บาท ถูกสร้างแล้ว กรุณาชำระภายในวันที่ ${dueDate.getDate()}/${month}/${year + 543}`,
        billId: bill._id,
        read: false,
        sentAt: new Date()
      });

      billsCreated++;
    } catch (error) {
      console.error(`Error creating bill for room ${room.roomNumber}:`, error);
    }
  }

  return billsCreated;
}

function getThaiMonth(month: number): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[month - 1];
}
```

**เพิ่มใน Cron Service:**
```typescript
// ทำงานทุกวันที่ 1 ของเดือน เวลา 00:00
export function startMonthlyBillGeneration() {
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running: Monthly bill generation');
    try {
      const count = await generateMonthlyBills();
      console.log(`Generated ${count} bills`);
    } catch (error) {
      console.error('Error in bill generation job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });
}
```

---

## 🔄 Complete Flow

### Notification Flow (Automated):
```
1. Cron Job ทำงานตามกำหนด
   ↓
2. เรียก notificationService functions
   ↓
3. Query bills ที่ตรงเงื่อนไข (due date, status)
   ↓
4. Loop ผ่านแต่ละ bill:
   - สร้าง notification ใน MongoDB
   - ส่ง email ผ่าน nodemailer
   ↓
5. Return จำนวน notifications ที่ส่ง
   ↓
6. Log ผลลัพธ์
```

### User View Flow:
```
1. User เข้า app
   ↓
2. Navbar แสดง bell icon พร้อม unread count
   ↓
3. User คลิก bell → dropdown แสดง notifications
   ↓
4. User คลิก "View All" → ไปที่ /notifications
   ↓
5. หน้า Notifications:
   - แสดงรายการทั้งหมด
   - Filter ตามประเภท/สถานะ
   - Mark as read / Delete
   - Link ไปบิล
   ↓
6. User คลิกดูบิล → ไปที่ /tenant/bills/[id]
```

### Admin Control Flow:
```
1. Admin ไปที่ /admin/notifications
   ↓
2. ดู statistics และ cron job status
   ↓
3. Manual trigger (ถ้าต้องการ):
   - คลิก "ส่งแจ้งเตือน 5 วัน"
   - API เรียก sendPaymentReminders(5)
   - แสดงผลลัพธ์
   ↓
4. ดู notification logs
```

---

## 🎨 UI/UX Guidelines

### Notification Type Icons:
| Type | Icon | Color |
|------|------|-------|
| payment_reminder | 🔔 | warning |
| payment_verified | ✅ | success |
| payment_rejected | ❌ | danger |
| overdue | ⚠️ | danger |
| bill_generated | 📄 | info |

### Status Badges:
- **NEW** (unread): `badge bg-danger`
- Read: ไม่มี badge

### Buttons:
- Mark as read: `btn-sm btn-outline-success`
- Delete: `btn-sm btn-outline-danger`
- View bill: `btn-sm btn-outline-primary`
- Trigger notification: `btn btn-primary`

---

## ⚠️ Error Handling

### Cron Job Errors:
```typescript
try {
  const count = await sendPaymentReminders(5);
  console.log(`Sent ${count} reminders`);
} catch (error) {
  console.error('Cron job failed:', error);
  // Optional: Send alert email to admin
  await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: 'Cron Job Failed',
    html: `Error: ${error.message}`
  });
}
```

### Email Send Errors:
```typescript
try {
  await sendEmail({ to, subject, html });
} catch (error) {
  console.error(`Email failed to ${to}:`, error);
  // Continue with other emails (don't block)
}
```

### Common Error Messages:
- `"ไม่สามารถส่งการแจ้งเตือนได้"` - Notification service failed
- `"ไม่สามารถส่งอีเมลได้"` - Email service failed
- `"ไม่พบการแจ้งเตือนนี้"` - Notification not found
- `"คุณไม่มีสิทธิ์ลบการแจ้งเตือนนี้"` - Not authorized to delete

---

## ✅ Testing Checklist

### Cron Jobs:
- [ ] ติดตั้ง node-cron สำเร็จ
- [ ] Cron jobs เริ่มต้นเมื่อ server start
- [ ] 5-day reminder ส่งถูกต้อง
- [ ] 1-day reminder ส่งถูกต้อง
- [ ] Overdue notification ส่งถูกต้อง
- [ ] Cleanup job ลบ notifications เก่า
- [ ] Timezone ตั้งเป็น Asia/Bangkok
- [ ] Cron jobs ไม่ซ้ำซ้อน (initialize once)

### Notifications Page:
- [ ] แสดงรายการ notifications
- [ ] Filter ตามสถานะทำงาน
- [ ] Filter ตามประเภททำงาน
- [ ] Mark as read ทำงาน
- [ ] Mark all as read ทำงาน
- [ ] Delete notification ทำงาน
- [ ] Delete all read ทำงาน
- [ ] Link ไปบิลทำงาน
- [ ] UI responsive บน mobile

### Admin Panel:
- [ ] แสดง statistics ถูกต้อง
- [ ] Manual trigger ทำงาน
- [ ] แสดง cron job status
- [ ] Notification logs แสดงถูกต้อง

### Email:
- [ ] Email templates แสดงถูกต้อง
- [ ] Email ส่งถึงผู้รับ
- [ ] Email subject ภาษาไทย
- [ ] Email body format ถูกต้อง
- [ ] Link ใน email ทำงาน

### Integration:
- [ ] Navbar bell icon แสดง count
- [ ] Navbar dropdown แสดง notifications
- [ ] Auto-refresh ทำงาน
- [ ] Payment verification trigger notification
- [ ] Notification link to bill ทำงาน

---

## 🚀 Implementation Steps

### Phase 1: Cron System (Priority 1) - Day 1-2
1. **ติดตั้ง node-cron**
   ```bash
   npm install node-cron
   npm install -D @types/node-cron
   ```

2. **สร้าง cronService.ts**
   - Define 4 cron jobs
   - Initialize function
   - Error handling

3. **Initialize cron jobs**
   - Option A: API route `/api/cron/init`
   - Option B: Root layout server-side
   - Test manual execution

4. **Test cron jobs**
   - ลอง trigger manually
   - ตรวจสอบ logs
   - Verify notifications created
   - Verify emails sent

### Phase 2: Notifications Page (Priority 1) - Day 3
1. **สร้าง notifications page**
   - `/notifications/page.tsx`
   - Fetch notifications
   - Display list

2. **Add filters**
   - Filter by read status
   - Filter by type
   - Apply filters to list

3. **Add actions**
   - Mark as read
   - Mark all as read
   - Delete notification
   - Delete all read

4. **Create API endpoint**
   - `DELETE /api/notifications/[id]`
   - Verify ownership
   - Error handling

### Phase 3: Admin Panel (Priority 2) - Day 4
1. **สร้าง admin notifications page**
   - `/admin/notifications/page.tsx`
   - Statistics display
   - Manual triggers

2. **Create stats API**
   - `/api/notifications/stats`
   - Count queries
   - Return metrics

3. **Add cron status display**
   - Show active jobs
   - Show next run times
   - Show recent logs

### Phase 4: Enhancements (Priority 3) - Day 5-6
1. **Profile page**
   - `/profile/page.tsx`
   - Edit user info
   - Change password
   - Notification preferences

2. **Bill auto-generation**
   - billService.ts
   - generateMonthlyBills()
   - Add to cron jobs
   - Test generation

3. **Testing & optimization**
   - End-to-end testing
   - Performance testing
   - Error scenario testing

---

## 📚 Reference Files

### Backend (Complete):
- **Notification API**: `src/app/api/notifications/`
- **Notification Model**: `src/models/Notification.ts`
- **Notification Service**: `src/services/notificationService.ts`
- **Email Service**: `src/lib/email.ts`
- **Bill Model**: `src/models/Bill.ts`
- **User Model**: `src/models/User.ts`

### Frontend (Existing):
- **Navbar**: `src/app/components/Navbar.tsx` (notification bell)
- **Notification Types**: `src/types/notification.ts`

### To Create:
- **Cron Service**: `src/services/cronService.ts` (NEW)
- **Bill Service**: `src/services/billService.ts` (NEW)
- **Notifications Page**: `src/app/notifications/page.tsx` (NEW)
- **Admin Panel**: `src/app/admin/notifications/page.tsx` (NEW)
- **Profile Page**: `src/app/profile/page.tsx` (NEW)
- **Stats API**: `src/app/api/notifications/stats/route.ts` (NEW)
- **Delete API**: `src/app/api/notifications/[id]/route.ts` (NEW)

---

## 🔧 Technical Notes

### Cron Jobs:
- Use `node-cron` for simplicity
- Set timezone to `Asia/Bangkok`
- Add error logging
- Prevent duplicate job initialization
- Consider job queue for scaling (Bull, Agenda)

### Email Service:
- Gmail SMTP has daily limit (~500 emails/day)
- Use app-specific password, not regular password
- Consider SendGrid/AWS SES for production
- Add retry logic for failed emails
- Log all email attempts

### Database:
- Index on (userId, read) for fast queries
- Cleanup old notifications periodically
- Consider archiving instead of deleting
- Monitor collection size

### Performance:
- Limit notification fetch (50-100 records)
- Use pagination for large lists
- Cache cron job status
- Batch database operations

### Security:
- Verify user ownership before deletion
- Admin-only manual triggers
- Sanitize email content
- Rate limit email sending

---

## 📝 Notes

- ✅ Backend notification system พร้อม 100%
- ✅ Email service พร้อมใช้งาน
- ✅ Navbar UI พร้อมแสดง notifications
- 🆕 ต้องติดตั้ง `node-cron` library
- 🆕 ต้องสร้าง cron service จากศูนย์
- 🆕 ต้องสร้างหน้า notifications และ admin panel
- ⚠️ **ห้าม commit เอง** - รอคำสั่งจาก PM
- ⚠️ Gmail SMTP มีข้อจำกัด - พิจารณา SendGrid/AWS SES
- ⚠️ Cron jobs ต้อง initialize only once
- 💡 ใช้ console.log สำหรับ debug cron jobs
- 💡 Test cron ด้วย shorter intervals ก่อน (e.g., every minute)

---

**สร้างโดย:** Project Manager
**วันที่:** 2025-11-21
**Version:** 1.0
**Status:** Ready for Implementation 🚀
**Estimated Time:** 5-6 days
