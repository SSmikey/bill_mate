# Dev C: Payment Processing & OCR Integration - แผนการพัฒนา

## 🎯 เป้าหมาย
สร้างระบบอัปโหลดสลิปและตรวจสอบการชำระเงินด้วย OCR และ QR Code สำหรับทั้ง Tenant และ Admin

---

## 📋 สิ่งที่มีอยู่แล้ว (Backend Ready ✓)

### ✅ REST API Endpoints (Complete)
- `GET /api/payments` - ดึงรายการการชำระเงินทั้งหมด (filtered by role)
- `POST /api/payments/upload` - อัปโหลดสลิปพร้อม OCR/QR data
- `GET /api/payments/[id]` - ดึงข้อมูลการชำระเดียว
- `PUT /api/payments/[id]/verify` - ยืนยัน/ปฏิเสธการชำระ (admin only)

### ✅ MongoDB Payment Model
```typescript
{
  billId: ObjectId;              // Bill reference
  userId: ObjectId;              // User who uploaded
  slipImageUrl: string;          // Base64 or image path
  ocrData: {                     // Extracted from OCR
    amount?: number;
    fee?: number;
    date?: string;
    time?: string;
    fromAccount?: string;
    toAccount?: string;
    reference?: string;
    transactionNo?: string;
  };
  qrData: {                      // Extracted from QR
    merchantId?: string;
    amount?: number;
    ref1?: string;
    ref2?: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: ObjectId;         // Admin who verified
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ✅ Bill Model
```typescript
{
  roomId: ObjectId;
  tenantId: ObjectId;
  month: number;                 // 1-12
  year: number;                  // YYYY
  rentAmount: number;
  waterAmount: number;
  electricityAmount: number;
  totalAmount: number;           // Sum of above
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'verified';
  createdAt: Date;
  updatedAt: Date;
}
```

### ✅ OCR Service (Tesseract.js)
**Location:** `src/services/ocrService.ts`

- `performOCR(imageBase64)` - อ่านข้อความจากภาพสลิป (Thai + English)
- Pattern extraction for:
  - จำนวนเงิน (multiple formats)
  - ค่าธรรมเนียม
  - วันที่-เวลา
  - เลขที่บัญชี
  - Reference numbers
  - Transaction numbers

### ✅ QR Service (jsQR)
**Location:** `src/services/qrService.ts`

- `scanQRCode(imageBase64)` - ตรวจจับ QR code
- `parsePromptPayData(qrText)` - แปลง PromptPay QR (ISO 20022 format)

### ✅ SlipReader Component (Full-featured)
**Location:** `src/app/components/SlipReader.tsx`

**Features:**
- 📤 Drag & drop file upload
- 📷 Image preview
- 🔍 QR code detection with jsQR
- 📝 OCR with Tesseract.js (Thai + English)
- 📊 Progress tracking (0-100%)
- 📋 JSON output display
- 📄 Full OCR text viewer
- 📎 Copy JSON to clipboard
- ✨ Advanced pattern extraction (better than service)

**Already handles:**
- Image compression
- Multiple image formats
- Error handling
- Loading states

### ✅ Notification System
- `notifyPaymentVerified()` - แจ้งเตือนเมื่อได้รับการอนุมัติ (email + in-app)
- `notifyPaymentRejected()` - แจ้งเตือนเมื่อถูกปฏิเสธ (email + in-app)
- Email templates พร้อมใช้งาน

### ✅ Navigation Links
- Admin sidebar: `/admin/payments` - "ยืนยันการชำระเงิน"
- Tenant sidebar: `/tenant/payments` - "ประวัติการชำระ"
- Tenant sidebar: `/tenant/bills` - "บิลของฉัน"

---

## 🔨 สิ่งที่ต้องสร้าง

### 1. **Tenant: Bill Detail & Payment Upload Page**
**ไฟล์:** `src/app/tenant/bills/[id]/page.tsx`

#### หน้าที่:
- แสดงรายละเอียดบิลครบถ้วน
- อัปโหลดสลิปการชำระเงิน
- แสดงประวัติการอัปโหลดสลิปของบิลนี้

#### Layout:
```
┌─────────────────────────────────────────────────────┐
│ บิลเดือน [เดือน/ปี] - ห้อง [roomNumber]            │
├─────────────────────────────────────────────────────┤
│ สถานะ: [pending/paid/verified/overdue badge]        │
│ วันครบกำหนด: [dueDate]                             │
├─────────────────────────────────────────────────────┤
│ รายละเอียดค่าใช้จ่าย:                              │
│   • ค่าเช่า: [rentAmount] บาท                      │
│   • ค่าน้ำ: [waterAmount] บาท                      │
│   • ค่าไฟ: [electricityAmount] บาท                 │
│   ────────────────────────────                      │
│   รวมทั้งหมด: [totalAmount] บาท                    │
├─────────────────────────────────────────────────────┤
│ [การอัปโหลดสลิป section]                           │
│   [PaymentUploadForm Component]                     │
├─────────────────────────────────────────────────────┤
│ ประวัติการชำระ:                                     │
│ ┌───────────────────────────────────────────────┐  │
│ │ สลิปที่ 1 - [วันที่อัปโหลด]                   │  │
│ │ สถานะ: [pending/verified/rejected]            │  │
│ │ จำนวน: [ocrData.amount] บาท                  │  │
│ │ [ดูรายละเอียด] button                         │  │
│ └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

#### State Management:
```typescript
const [bill, setBill] = useState<Bill | null>(null);
const [payments, setPayments] = useState<Payment[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

#### Data Fetching:
```typescript
// 1. Fetch bill details
const billResponse = await fetch(`/api/bills/${id}`);

// 2. Fetch payments for this bill
const paymentsResponse = await fetch(`/api/payments?billId=${id}`);
```

#### Key Features:
- ✅ แสดงสถานะบิลด้วย badge สีต่างกัน
- ✅ แสดงจำนวนเงินแยกรายการ
- ✅ ส่วนอัปโหลดสลิปใช้ PaymentUploadForm component
- ✅ แสดงประวัติการอัปโหลดทั้งหมดของบิลนี้
- ✅ ปิดการอัปโหลดถ้าบิลถูกยืนยันแล้ว (status = 'verified')

---

### 2. **PaymentUploadForm Component**
**ไฟล์:** `src/app/components/PaymentUploadForm.tsx`

#### Props:
```typescript
interface PaymentUploadFormProps {
  billId: string;
  billAmount: number;
  onUploadSuccess: () => void;
}
```

#### Features:
- ใช้ SlipReader component ที่มีอยู่สำหรับอัปโหลดและ OCR
- แสดงข้อมูลที่ extract ได้ให้ user ตรวจสอบ
- เปรียบเทียบจำนวนเงิน OCR กับจำนวนในบิล
- ส่งข้อมูลไปที่ `/api/payments/upload`

#### Workflow:
```
1. User อัปโหลดรูปผ่าน SlipReader
   ↓
2. SlipReader ทำ OCR + QR detection อัตโนมัติ
   ↓
3. แสดงข้อมูลที่ extract ได้:
   - จำนวนเงิน (เปรียบเทียบกับบิล)
   - วันที่-เวลา
   - เลขที่บัญชี
   - Reference
   ↓
4. User กด "ยืนยันการอัปโหลด"
   ↓
5. POST /api/payments/upload {
     billId,
     slipImageBase64,
     ocrData,
     qrData
   }
   ↓
6. Success: แสดง success message + เรียก onUploadSuccess()
   Error: แสดง error message
```

#### Layout Structure:
```tsx
<div className="card">
  <div className="card-header">
    <h5>อัปโหลดสลิปการชำระเงิน</h5>
  </div>
  <div className="card-body">
    {/* SlipReader Component */}
    <SlipReader onScanComplete={handleScanComplete} />

    {/* Extracted Data Display (if available) */}
    {ocrData && (
      <div className="mt-3">
        <h6>ข้อมูลที่ตรวจพบจากสลิป:</h6>
        <table className="table table-sm">
          <tr>
            <td>จำนวนเงิน:</td>
            <td>{ocrData.amount} บาท</td>
            <td>
              {ocrData.amount === billAmount ? (
                <span className="badge bg-success">ตรงกับบิล</span>
              ) : (
                <span className="badge bg-warning">ไม่ตรงกับบิล</span>
              )}
            </td>
          </tr>
          <tr>
            <td>วันที่:</td>
            <td>{ocrData.date}</td>
          </tr>
          <tr>
            <td>เวลา:</td>
            <td>{ocrData.time}</td>
          </tr>
          {/* More fields */}
        </table>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={uploading}
        >
          {uploading ? 'กำลังอัปโหลด...' : 'ยืนยันการอัปโหลด'}
        </button>
      </div>
    )}
  </div>
</div>
```

#### Validation:
```typescript
function validatePayment() {
  if (!slipImageBase64) return "กรุณาอัปโหลดรูปสลิป";
  if (!ocrData && !qrData) return "ไม่สามารถอ่านข้อมูลจากสลิปได้";

  // Warning if amount doesn't match (not blocking)
  if (ocrData?.amount && Math.abs(ocrData.amount - billAmount) > 100) {
    return {
      type: 'warning',
      message: `จำนวนเงินที่อ่านได้ (${ocrData.amount} บาท) ไม่ตรงกับบิล (${billAmount} บาท)`
    };
  }

  return null;
}
```

---

### 3. **Tenant: Payment History Page**
**ไฟล์:** `src/app/tenant/payments/page.tsx`

#### หน้าที่:
- แสดงรายการการชำระเงินทั้งหมดของ tenant
- Filter ตามสถานะ (pending/verified/rejected)
- ดูรายละเอียดแต่ละรายการ

#### Layout:
```
┌──────────────────────────────────────────────────────┐
│ ประวัติการชำระเงิน                                   │
├──────────────────────────────────────────────────────┤
│ Filter: [ทั้งหมด] [รอตรวจสอบ] [อนุมัติแล้ว] [ปฏิเสธ]│
├──────────────────────────────────────────────────────┤
│ ตาราง:                                               │
│ ┌────────┬──────────┬────────┬──────────┬─────────┐ │
│ │วันที่  │บิล       │จำนวน  │สถานะ     │การจัดการ│ │
│ ├────────┼──────────┼────────┼──────────┼─────────┤ │
│ │21/11/25│ต.ค. 2567│3,000   │[pending] │[ดู]     │ │
│ │20/10/25│ก.ย. 2567│3,000   │[verified]│[ดู]     │ │
│ │15/10/25│ก.ย. 2567│3,000   │[rejected]│[ดู]     │ │
│ │        │          │        │เหตุผล: XX│         │ │
│ └────────┴──────────┴────────┴──────────┴─────────┘ │
└──────────────────────────────────────────────────────┘
```

#### State Management:
```typescript
const [payments, setPayments] = useState<Payment[]>([]);
const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
```

#### Features:
- ✅ ดึงข้อมูลจาก `GET /api/payments` (auto-filtered by session)
- ✅ Filter ตามสถานะ: all, pending, verified, rejected
- ✅ แสดง badge สีต่างกันตามสถานะ
- ✅ แสดงเหตุผลถ้าถูกปฏิเสธ
- ✅ Link ไปดูรายละเอียดบิล (`/tenant/bills/[billId]`)
- ✅ แสดงข้อมูล bill (month/year) ที่ populate มา

#### Status Badges:
```tsx
{payment.status === 'pending' && (
  <span className="badge bg-warning">รอตรวจสอบ</span>
)}
{payment.status === 'verified' && (
  <span className="badge bg-success">อนุมัติแล้ว</span>
)}
{payment.status === 'rejected' && (
  <>
    <span className="badge bg-danger">ปฏิเสธ</span>
    <div className="small text-danger">
      เหตุผล: {payment.rejectionReason}
    </div>
  </>
)}
```

---

### 4. **Admin: Payment Verification Page**
**ไฟล์:** `src/app/admin/payments/page.tsx`

#### หน้าที่:
- แสดงรายการการชำระเงินที่รอการตรวจสอบ
- ดูรายละเอียดสลิปและข้อมูล OCR/QR
- อนุมัติหรือปฏิเสธการชำระ

#### Layout:
```
┌──────────────────────────────────────────────────────┐
│ ยืนยันการชำระเงิน                                    │
├──────────────────────────────────────────────────────┤
│ Filter: [รอตรวจสอบ (15)] [อนุมัติแล้ว] [ปฏิเสธ]     │
├──────────────────────────────────────────────────────┤
│ ตาราง:                                               │
│ ┌──────┬─────┬──────┬────────┬───────┬────────────┐ │
│ │วันที่│ห้อง │ผู้เช่า│บิล    │จำนวน│การจัดการ   │ │
│ ├──────┼─────┼──────┼────────┼───────┼────────────┤ │
│ │21/11 │101  │สมชาย │ต.ค.   │3,000  │[ตรวจสอบ]  │ │
│ │      │     │      │3,000บ. │(OCR)  │            │ │
│ └──────┴─────┴──────┴────────┴───────┴────────────┘ │
└──────────────────────────────────────────────────────┘
```

#### State Management:
```typescript
const [payments, setPayments] = useState<Payment[]>([]);
const [filter, setFilter] = useState<PaymentStatus | 'all'>('pending');
const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
const [showModal, setShowModal] = useState(false);
```

#### Key Features:
- ✅ Default filter: 'pending' (รอตรวจสอบ)
- ✅ แสดงจำนวนเงินจากบิลและจาก OCR เปรียบเทียบกัน
- ✅ คลิก "ตรวจสอบ" เพื่อเปิด modal ดูรายละเอียด
- ✅ Modal แสดง:
  - รูปสลิป (preview)
  - ข้อมูล OCR ทั้งหมด
  - ข้อมูล QR (ถ้ามี)
  - ข้อมูลบิล
  - ปุ่ม "อนุมัติ" และ "ปฏิเสธ"

#### Verification Modal:
```tsx
<Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>ตรวจสอบการชำระเงิน</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="row">
      {/* Left: Slip Image */}
      <div className="col-md-6">
        <h6>สลิปการชำระ:</h6>
        <img
          src={selectedPayment?.slipImageUrl}
          className="img-fluid border"
          alt="Payment slip"
        />
      </div>

      {/* Right: Details */}
      <div className="col-md-6">
        <h6>ข้อมูลบิล:</h6>
        <table className="table table-sm">
          <tr>
            <td>ห้อง:</td>
            <td>{bill.roomId.roomNumber}</td>
          </tr>
          <tr>
            <td>ผู้เช่า:</td>
            <td>{selectedPayment?.userId.name}</td>
          </tr>
          <tr>
            <td>ยอดบิล:</td>
            <td><strong>{bill.totalAmount} บาท</strong></td>
          </tr>
        </table>

        <h6 className="mt-3">ข้อมูลจาก OCR:</h6>
        <table className="table table-sm">
          <tr>
            <td>จำนวนเงิน:</td>
            <td>
              <strong>{selectedPayment?.ocrData.amount} บาท</strong>
              {isAmountMatch ? (
                <span className="badge bg-success ms-2">ตรงกัน</span>
              ) : (
                <span className="badge bg-warning ms-2">ไม่ตรงกัน</span>
              )}
            </td>
          </tr>
          <tr>
            <td>วันที่:</td>
            <td>{selectedPayment?.ocrData.date}</td>
          </tr>
          <tr>
            <td>เวลา:</td>
            <td>{selectedPayment?.ocrData.time}</td>
          </tr>
          <tr>
            <td>จากบัญชี:</td>
            <td>{selectedPayment?.ocrData.fromAccount}</td>
          </tr>
          <tr>
            <td>ไปบัญชี:</td>
            <td>{selectedPayment?.ocrData.toAccount}</td>
          </tr>
          <tr>
            <td>เลขที่อ้างอิง:</td>
            <td>{selectedPayment?.ocrData.reference}</td>
          </tr>
        </table>

        {selectedPayment?.qrData && (
          <>
            <h6 className="mt-3">ข้อมูลจาก QR:</h6>
            <table className="table table-sm">
              <tr>
                <td>Merchant ID:</td>
                <td>{selectedPayment.qrData.merchantId}</td>
              </tr>
              <tr>
                <td>จำนวนเงิน:</td>
                <td>{selectedPayment.qrData.amount}</td>
              </tr>
            </table>
          </>
        )}
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      ปิด
    </Button>
    <Button
      variant="danger"
      onClick={() => handleReject()}
    >
      ปฏิเสธ
    </Button>
    <Button
      variant="success"
      onClick={() => handleApprove()}
    >
      อนุมัติ
    </Button>
  </Modal.Footer>
</Modal>
```

#### Approve/Reject Actions:
```typescript
async function handleApprove() {
  const response = await fetch(`/api/payments/${selectedPayment._id}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved: true })
  });

  if (response.ok) {
    // แสดง success message
    // รีเฟรชรายการ
    // ปิด modal
    await fetchPayments();
    setShowModal(false);
  }
}

async function handleReject() {
  const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
  if (!reason) return;

  const response = await fetch(`/api/payments/${selectedPayment._id}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      approved: false,
      rejectionReason: reason
    })
  });

  if (response.ok) {
    await fetchPayments();
    setShowModal(false);
  }
}
```

---

### 5. **Admin: Payment Detail Page (Optional)**
**ไฟล์:** `src/app/admin/payments/[id]/page.tsx`

#### หน้าที่:
- แสดงรายละเอียดการชำระเงินอย่างละเอียด
- ใช้สำหรับกรณีต้องการดูข้อมูลย้อนหลัง

#### Features:
- แสดงข้อมูลเหมือน modal ในหน้า verification
- แสดงประวัติการอนุมัติ/ปฏิเสธ (verifiedBy, verifiedAt)
- แสดงข้อมูล OCR text ทั้งหมด (full text)
- ไม่มีปุ่มอนุมัติ/ปฏิเสธ (read-only)

---

### 6. **Tenant: Bills List Page (Optional Enhancement)**
**ไฟล์:** `src/app/tenant/bills/page.tsx`

#### หน้าที่:
- แสดงรายการบิลทั้งหมดของ tenant
- Link ไปแต่ละบิล

#### Layout:
```
┌──────────────────────────────────────────────────────┐
│ บิลของฉัน                                            │
├──────────────────────────────────────────────────────┤
│ ตาราง:                                               │
│ ┌──────────┬─────┬────────┬───────────┬────────────┐│
│ │เดือน/ปี │ห้อง │ยอดรวม │ครบกำหนด  │สถานะ       ││
│ ├──────────┼─────┼────────┼───────────┼────────────┤│
│ │ต.ค. 2567│101  │3,000   │25/10/2567 │[verified]  ││
│ │          │     │        │           │[ดูบิล]     ││
│ │ก.ย. 2567│101  │3,000   │25/09/2567 │[pending]   ││
│ │          │     │        │           │[ชำระเงิน]  ││
│ └──────────┴─────┴────────┴───────────┴────────────┘│
└──────────────────────────────────────────────────────┘
```

**Note:** หน้านี้อาจไม่จำเป็นมากนัก เพราะ Tenant Dashboard แสดงข้อมูลคล้ายกันแล้ว

---

## 🔄 Complete User Flow

### Tenant Flow: การชำระเงิน
```
1. Tenant ล็อกอินเข้าระบบ
   ↓
2. ไปที่ Tenant Dashboard หรือ Bills List
   ↓
3. เห็นบิลที่ยังไม่ได้ชำระ (status: pending)
   ↓
4. คลิก "ชำระเงิน" → ไปที่ /tenant/bills/[id]
   ↓
5. ดูรายละเอียดบิล (rent, water, electricity, total)
   ↓
6. ส่วน "อัปโหลดสลิป":
   - อัปโหลดรูปผ่าน SlipReader (drag & drop)
   - รอ OCR + QR detection (progress bar)
   - ดูข้อมูลที่ extract ได้
   - เช็คว่าจำนวนเงินตรงกับบิลหรือไม่
   ↓
7. กด "ยืนยันการอัปโหลด"
   ↓
8. ระบบบันทึกข้อมูล (POST /api/payments/upload)
   ↓
9. Bill status เปลี่ยนเป็น 'paid'
   Payment status เป็น 'pending'
   ↓
10. แสดง success message "อัปโหลดสลิปเรียบร้อยแล้ว รอการตรวจสอบ"
    ↓
11. (Optional) ไปดูประวัติที่ /tenant/payments
```

### Admin Flow: การตรวจสอบการชำระ
```
1. Admin ล็อกอินเข้าระบบ
   ↓
2. ไปที่ /admin/payments (ยืนยันการชำระเงิน)
   ↓
3. เห็นรายการที่รอตรวจสอบ (default filter: pending)
   ↓
4. คลิก "ตรวจสอบ" บนรายการที่ต้องการ
   ↓
5. Modal แสดง:
   - รูปสลิป
   - ข้อมูล OCR/QR
   - ข้อมูลบิล
   - เปรียบเทียบจำนวนเงิน
   ↓
6. Admin ตัดสินใจ:

   [กรณีอนุมัติ]
   - คลิก "อนุมัติ"
   - ระบบ:
     • Payment status → 'verified'
     • Bill status → 'verified'
     • บันทึก verifiedBy, verifiedAt
     • ส่งอีเมล + notification ไปหา tenant

   [กรณีปฏิเสธ]
   - คลิก "ปฏิเสธ"
   - กรอกเหตุผล (required)
   - ระบบ:
     • Payment status → 'rejected'
     • Bill status → 'pending' (กลับมารอชำระใหม่)
     • บันทึก rejectionReason
     • ส่งอีเมล + notification พร้อมเหตุผลไปหา tenant
   ↓
7. รายการหายจาก "รอตรวจสอบ" list
   ↓
8. Tenant ได้รับ notification และสามารถดูสถานะได้
```

---

## 🎨 UI/UX Guidelines

### Status Colors:
| Status | Badge Class | Thai Label | Use Case |
|--------|------------|------------|----------|
| pending | `badge bg-warning text-dark` | รอตรวจสอบ | Payment waiting for admin |
| verified | `badge bg-success` | อนุมัติแล้ว | Payment approved |
| rejected | `badge bg-danger` | ปฏิเสธ | Payment rejected |

### Bill Status Colors:
| Status | Badge Class | Thai Label |
|--------|------------|------------|
| pending | `badge bg-secondary` | ยังไม่ชำระ |
| paid | `badge bg-info` | ชำระแล้ว (รอตรวจสอบ) |
| verified | `badge bg-success` | ยืนยันแล้ว |
| overdue | `badge bg-danger` | เกินกำหนด |

### Buttons:
- **อัปโหลดสลิป**: `btn btn-primary`
- **ยืนยันการอัปโหลด**: `btn btn-primary`
- **ตรวจสอบ**: `btn btn-sm btn-outline-primary`
- **อนุมัติ**: `btn btn-success`
- **ปฏิเสธ**: `btn btn-danger`
- **ดูรายละเอียด**: `btn btn-sm btn-link`

### Icons (Bootstrap Icons):
- อัปโหลด: `bi bi-upload`
- ตรวจสอบ: `bi bi-check-circle`
- อนุมัติ: `bi bi-check-lg`
- ปฏิเสธ: `bi bi-x-lg`
- ดู: `bi bi-eye`
- สลิป: `bi bi-receipt`

---

## ⚠️ Error Handling

### Common Errors (ภาษาไทย):

**Payment Upload:**
- `"กรุณาอัปโหลดรูปสลิป"` - ไม่ได้อัปโหลดรูป
- `"ไม่สามารถอ่านข้อมูลจากสลิปได้"` - OCR + QR ล้มเหลวทั้งคู่
- `"ไม่พบบิลที่ระบุ"` - billId ไม่ถูกต้อง
- `"คุณไม่มีสิทธิ์ชำระบิลนี้"` - ไม่ใช่เจ้าของบิล
- `"บิลนี้ถูกยืนยันแล้ว ไม่สามารถอัปโหลดเพิ่มได้"` - bill verified แล้ว

**Payment Verification:**
- `"ไม่พบข้อมูลการชำระ"` - payment not found
- `"กรุณาระบุเหตุผลในการปฏิเสธ"` - reject without reason
- `"คุณไม่มีสิทธิ์ในการดำเนินการนี้"` - not admin

**General:**
- `"เกิดข้อผิดพลาดในการเชื่อมต่อ"` - network error
- `"ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)"` - file size limit

---

## 📦 Type Definitions

### Payment Interface:
```typescript
interface Payment {
  _id: string;
  billId: {
    _id: string;
    month: number;
    year: number;
    totalAmount: number;
    roomId: {
      roomNumber: string;
    };
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  slipImageUrl: string;
  ocrData: {
    amount?: number;
    fee?: number;
    date?: string;
    time?: string;
    fromAccount?: string;
    toAccount?: string;
    reference?: string;
    transactionNo?: string;
  };
  qrData?: {
    merchantId?: string;
    amount?: number;
    ref1?: string;
    ref2?: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: {
    _id: string;
    name: string;
  };
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Bill Interface:
```typescript
interface Bill {
  _id: string;
  roomId: {
    _id: string;
    roomNumber: string;
  };
  tenantId: {
    _id: string;
    name: string;
  };
  month: number;
  year: number;
  rentAmount: number;
  waterAmount: number;
  electricityAmount: number;
  totalAmount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'verified';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ✅ Testing Checklist

### Tenant: อัปโหลดสลิป
- [ ] อัปโหลดรูปสลิปสำเร็จ (drag & drop)
- [ ] OCR อ่านจำนวนเงินได้ถูกต้อง
- [ ] QR code ถูกตรวจจับถ้ามี
- [ ] แสดงเตือนถ้าจำนวนเงินไม่ตรงกับบิล
- [ ] ยืนยันการอัปโหลดสำเร็จ
- [ ] Bill status เปลี่ยนเป็น 'paid'
- [ ] Payment status เป็น 'pending'
- [ ] ไม่สามารถอัปโหลดซ้ำถ้าบิลยืนยันแล้ว
- [ ] แสดง error ถ้าไฟล์ใหญ่เกินไป

### Tenant: ประวัติการชำระ
- [ ] แสดงรายการการชำระทั้งหมด
- [ ] Filter ตามสถานะทำงานถูกต้อง
- [ ] แสดงเหตุผลถ้าถูกปฏิเสธ
- [ ] Link ไปยังบิลทำงาน

### Admin: ตรวจสอบการชำระ
- [ ] แสดงรายการ pending ถูกต้อง
- [ ] Modal แสดงข้อมูลครบถ้วน
- [ ] รูปสลิปแสดงชัดเจน
- [ ] เปรียบเทียบจำนวนเงินถูกต้อง
- [ ] อนุมัติสำเร็จ
  - Payment status → verified
  - Bill status → verified
  - Tenant ได้รับ notification
- [ ] ปฏิเสธสำเร็จ (พร้อมเหตุผล)
  - Payment status → rejected
  - Bill status → pending
  - Tenant ได้รับ notification พร้อมเหตุผล
- [ ] Filter ทำงานถูกต้อง

### Notifications
- [ ] Email ส่งถึง tenant เมื่ออนุมัติ
- [ ] Email ส่งถึง tenant เมื่อปฏิเสธ
- [ ] In-app notification แสดงใน Navbar
- [ ] Notification link ไปยังบิลที่เกี่ยวข้อง

---

## 🚀 Implementation Steps

### Phase 1: Tenant Payment Upload (Priority 1)
1. **สร้าง PaymentUploadForm Component**
   - ไฟล์: `src/app/components/PaymentUploadForm.tsx`
   - Integrate SlipReader
   - แสดงข้อมูล OCR/QR
   - ส่งข้อมูลไปที่ API

2. **สร้าง Bill Detail Page**
   - ไฟล์: `src/app/tenant/bills/[id]/page.tsx`
   - แสดงรายละเอียดบิล
   - Integrate PaymentUploadForm
   - แสดงประวัติการอัปโหลด

3. **Test Upload Flow**
   - Upload รูปสลิป
   - ตรวจสอบ OCR/QR detection
   - Verify API call
   - Check bill status update

### Phase 2: Admin Payment Verification (Priority 1)
1. **สร้าง Admin Payments Page**
   - ไฟล์: `src/app/admin/payments/page.tsx`
   - แสดงตารางรายการ
   - Filter ตามสถานะ
   - Modal สำหรับตรวจสอบ

2. **Implement Verification Actions**
   - Approve function
   - Reject function (with reason)
   - Update UI after action

3. **Test Verification Flow**
   - Approve payment
   - Reject payment
   - Check notifications
   - Verify status updates

### Phase 3: Payment History (Priority 2)
1. **สร้าง Payment History Page**
   - ไฟล์: `src/app/tenant/payments/page.tsx`
   - แสดงรายการ
   - Filter
   - Link ไปบิล

2. **Test History View**
   - ดูรายการทั้งหมด
   - Filter ทำงาน
   - แสดง rejection reason

### Phase 4: Optional Enhancements (Priority 3)
1. Bills list page (`/tenant/bills/page.tsx`)
2. Payment detail page (`/admin/payments/[id]/page.tsx`)
3. File storage implementation (replace base64)
4. Amount validation middleware
5. Bulk verification actions

---

## 📚 Reference Files

### Backend (Already Complete):
- **Payment API**: `src/app/api/payments/route.ts`
- **Upload API**: `src/app/api/payments/upload/route.ts`
- **Verify API**: `src/app/api/payments/[id]/verify/route.ts`
- **Payment Model**: `src/models/Payment.ts`
- **Bill Model**: `src/models/Bill.ts`
- **OCR Service**: `src/services/ocrService.ts`
- **QR Service**: `src/services/qrService.ts`
- **Notification Service**: `src/services/notificationService.ts`

### Frontend (To Reference):
- **SlipReader Component**: `src/app/components/SlipReader.tsx` (use as-is)
- **UserForm**: `src/app/components/UserForm.tsx` (form pattern)
- **Admin Users Page**: `src/app/admin/users/page.tsx` (table + CRUD pattern)
- **Payment Types**: `src/types/payment.ts`
- **Bill Types**: `src/types/bill.ts`

---

## 🔧 Technical Notes

### Image Handling:
- **Current**: Base64 stored in database (not ideal for production)
- **Recommended**: Upload to cloud storage (S3/Cloud Storage) and store URL
- **For MVP**: Base64 is acceptable, plan migration later

### OCR Accuracy:
- Thai OCR accuracy ~70-80% with Tesseract
- May need manual correction interface
- Admin can see extracted data and compare with image

### Amount Validation:
- Allow tolerance (±100 baht for fees)
- Don't block upload if amount doesn't match exactly
- Show warning and let admin decide

### Performance:
- OCR processing takes 5-15 seconds
- Show progress bar to user
- Consider server-side OCR for better performance (future)

### Security:
- Validate file type (image only)
- Limit file size (5MB recommended)
- Sanitize OCR/QR data before storing
- Admin-only verification endpoint

---

## 📝 Notes

- ✅ Backend API พร้อมใช้งาน 100%
- ✅ SlipReader component พร้อมใช้งาน (drag & drop, OCR, QR)
- ✅ Notification system พร้อมใช้งาน
- ✅ Email templates พร้อมใช้งาน
- ⚠️ **ห้าม commit เอง** - รอคำสั่งจาก PM
- ⚠️ ระวัง async operations (OCR takes time)
- ⚠️ Base64 image storage ไม่เหมาะกับ production scale (ใช้ได้สำหรับ MVP)
- 💡 พิจารณา image compression ก่อน upload
- 💡 อาจเพิ่ม retry mechanism สำหรับ OCR ที่ล้มเหลว

---

**สร้างโดย:** Project Manager
**วันที่:** 2025-11-21
**Version:** 1.0
**Status:** Ready for Implementation 🚀
**Estimated Time:** 2-3 days (Phase 1 + 2)