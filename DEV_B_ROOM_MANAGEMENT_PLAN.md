# Dev B: Room Management UI - แผนการพัฒนา

## 🎯 เป้าหมาย
สร้างระบบจัดการห้องพักสำหรับ Admin พร้อม CRUD operations ครบถ้วน

---

## 📋 สิ่งที่มีอยู่แล้ว (Backend Ready)

### ✅ REST API Endpoints
- `GET /api/rooms` - ดึงข้อมูลห้องทั้งหมด
- `POST /api/rooms` - สร้างห้องใหม่ (admin only)
- `GET /api/rooms/[id]` - ดึงข้อมูลห้องเดียว
- `PUT /api/rooms/[id]` - แก้ไขข้อมูลห้อง (admin only)
- `DELETE /api/rooms/[id]` - ลบห้อง (admin only)

### ✅ MongoDB Room Model
```typescript
{
  roomNumber: string;        // เลขห้อง (unique)
  floor?: number;            // ชั้น (optional)
  rentPrice: number;         // ค่าเช่า
  waterPrice: number;        // ค่าน้ำ
  electricityPrice: number;  // ค่าไฟ
  isOccupied: boolean;       // สถานะการเช่า (default: false)
  tenantId?: ObjectId;       // ผู้เช่า (reference to User)
  createdAt: Date;
  updatedAt: Date;
}
```

### ✅ TypeScript Types
- `RoomData` - interface สำหรับแสดงผลข้อมูลห้อง
- `CreateRoomDto` - interface สำหรับสร้างห้องใหม่
- `UpdateRoomDto` - interface สำหรับอัปเดตห้อง

### ✅ Admin Sidebar
- มี link "จัดการห้องพัก" ไปที่ `/admin/rooms` แล้ว (แต่หน้ายังไม่มี)

---

## 🔨 สิ่งที่ต้องสร้าง

### 1. **RoomForm Component**
**ไฟล์:** `src/app/components/RoomForm.tsx`

#### Props Interface:
```typescript
interface RoomFormProps {
  initialData?: {
    _id?: string;
    roomNumber: string;
    floor?: number;
    rentPrice: number;
    waterPrice: number;
    electricityPrice: number;
  };
  onSubmit: (data: RoomFormData) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
}
```

#### ฟิลด์ในฟอร์ม:
1. **หมายเลขห้อง** (`roomNumber`)
   - Type: text input
   - Required: ✅
   - Validation: ห้ามว่าง
   - Example: "101", "A-201"

2. **ชั้น** (`floor`)
   - Type: number input
   - Required: ❌ (optional)
   - Example: 1, 2, 3

3. **ค่าเช่า** (`rentPrice`)
   - Type: number input
   - Required: ✅
   - Validation: ต้องเป็นตัวเลข >= 0
   - Example: 3000

4. **ค่าน้ำ** (`waterPrice`)
   - Type: number input
   - Required: ✅
   - Validation: ต้องเป็นตัวเลข >= 0
   - Example: 150

5. **ค่าไฟ** (`electricityPrice`)
   - Type: number input
   - Required: ✅
   - Validation: ต้องเป็นตัวเลข >= 0
   - Example: 600

#### Features ที่ต้องมี:
- ✅ รองรับทั้งโหมด **Create** และ **Edit**
- ✅ Client-side validation พร้อมข้อความภาษาไทย
- ✅ แสดง error/success messages
- ✅ Loading state พร้อม spinner
- ✅ ปุ่ม Submit และ Reset
- ✅ Bootstrap styling (form-control, form-label, etc.)
- ✅ Layout แบบ 2 columns (col-md-6)

#### Layout Structure:
```
┌─────────────────────────────────────────┐
│ [Error/Success Alert]                   │
├─────────────────┬───────────────────────┤
│ หมายเลขห้อง *  │ ชั้น                  │
├─────────────────┼───────────────────────┤
│ ค่าเช่า *       │ ค่าน้ำ *              │
├─────────────────┼───────────────────────┤
│ ค่าไฟ *         │                       │
├─────────────────┴───────────────────────┤
│ [บันทึก] [รีเซ็ต]                      │
└─────────────────────────────────────────┘
```

#### Validation Rules:
```typescript
validateForm() {
  if (!roomNumber) return "กรุณากรอกหมายเลขห้อง"
  if (!rentPrice || rentPrice < 0) return "กรุณากรอกค่าเช่าที่ถูกต้อง"
  if (!waterPrice || waterPrice < 0) return "กรุณากรอกค่าน้ำที่ถูกต้อง"
  if (!electricityPrice || electricityPrice < 0) return "กรุณากรอกค่าไฟที่ถูกต้อง"
  return null; // valid
}
```

---

### 2. **Admin Rooms Management Page**
**ไฟล์:** `src/app/admin/rooms/page.tsx`

#### Page Structure:
```
┌──────────────────────────────────────────────────────┐
│ จัดการห้องพัก                                        │
├──────────────────────────────────────────────────────┤
│ [+ เพิ่มห้องใหม่]                                    │
├──────────────────────────────────────────────────────┤
│ [RoomForm - แสดง/ซ่อน เมื่อคลิก]                    │
├──────────────────────────────────────────────────────┤
│ Filter: [ทั้งหมด (50)] [ว่าง (30)] [มีผู้เช่า (20)]│
├──────────────────────────────────────────────────────┤
│ ตารางห้องพัก:                                        │
│ ┌────┬──────┬───────┬────────┬────────┬────────────┐│
│ │ห้อง│ชั้น  │ค่าเช่า│ค่าน้ำ  │ค่าไฟ  │สถานะ/ผู้เช่า││
│ ├────┼──────┼───────┼────────┼────────┼────────────┤│
│ │101 │1     │3000   │150     │600     │[ว่าง]      ││
│ │    │      │       │        │        │[แก้ไข][ลบ]││
│ ├────┼──────┼───────┼────────┼────────┼────────────┤│
│ │102 │1     │3000   │150     │600     │คุณสมชาย    ││
│ │    │      │       │        │        │[แก้ไข][ลบ]││
│ └────┴──────┴───────┴────────┴────────┴────────────┘│
└──────────────────────────────────────────────────────┘
```

#### State Management:
```typescript
const [rooms, setRooms] = useState<Room[]>([]);
const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all');
const [showForm, setShowForm] = useState(false);
const [editingRoom, setEditingRoom] = useState<Room | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

#### Features ที่ต้องมี:

##### 1. ดึงข้อมูลห้องทั้งหมด
```typescript
async function fetchRooms() {
  const response = await fetch('/api/rooms');
  const result = await response.json();
  setRooms(result.data);
}
```

##### 2. สร้างห้องใหม่
```typescript
async function handleCreate(formData) {
  const response = await fetch('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  if (response.ok) {
    // รีเฟรชรายการ
    await fetchRooms();
    setShowForm(false);
  }
}
```

##### 3. แก้ไขห้อง
```typescript
async function handleEdit(roomId, formData) {
  const response = await fetch(`/api/rooms/${roomId}`, {
    method: 'PUT',
    body: JSON.stringify(formData)
  });
  if (response.ok) {
    await fetchRooms();
    setEditingRoom(null);
    setShowForm(false);
  }
}
```

##### 4. ลบห้อง (พร้อม confirmation)
```typescript
async function handleDelete(roomId, roomNumber) {
  const confirmed = window.confirm(
    `ต้องการลบห้อง ${roomNumber} ใช่หรือไม่?`
  );
  if (!confirmed) return;

  const response = await fetch(`/api/rooms/${roomId}`, {
    method: 'DELETE'
  });
  if (response.ok) {
    await fetchRooms();
  }
}
```

##### 5. Filter ห้องตามสถานะ
```typescript
function filterRooms(status: 'all' | 'available' | 'occupied') {
  if (status === 'all') {
    setFilteredRooms(rooms);
  } else if (status === 'available') {
    setFilteredRooms(rooms.filter(r => !r.isOccupied));
  } else {
    setFilteredRooms(rooms.filter(r => r.isOccupied));
  }
  setFilter(status);
}
```

#### Table Columns:
| Column | Display | Note |
|--------|---------|------|
| หมายเลขห้อง | `room.roomNumber` | |
| ชั้น | `room.floor \|\| '-'` | แสดง '-' ถ้าไม่มีข้อมูล |
| ค่าเช่า | `room.rentPrice.toLocaleString('th-TH')` | จัด format เป็นเลขไทย |
| ค่าน้ำ | `room.waterPrice.toLocaleString('th-TH')` | |
| ค่าไฟ | `room.electricityPrice.toLocaleString('th-TH')` | |
| สถานะ/ผู้เช่า | Badge + tenant name | ว่าง (success) / มีผู้เช่า (warning) |
| การจัดการ | Edit & Delete buttons | Danger buttons |

#### UI Components:

##### Filter Badges:
```tsx
<div className="mb-3">
  <span
    className={`badge ${filter === 'all' ? 'bg-primary' : 'bg-secondary'} me-2`}
    onClick={() => filterRooms('all')}
    style={{ cursor: 'pointer' }}
  >
    ทั้งหมด ({rooms.length})
  </span>
  <span
    className={`badge ${filter === 'available' ? 'bg-success' : 'bg-secondary'} me-2`}
    onClick={() => filterRooms('available')}
    style={{ cursor: 'pointer' }}
  >
    ห้องว่าง ({rooms.filter(r => !r.isOccupied).length})
  </span>
  <span
    className={`badge ${filter === 'occupied' ? 'bg-warning' : 'bg-secondary'}`}
    onClick={() => filterRooms('occupied')}
    style={{ cursor: 'pointer' }}
  >
    มีผู้เช่า ({rooms.filter(r => r.isOccupied).length})
  </span>
</div>
```

##### Status Badge:
```tsx
{room.isOccupied ? (
  <>
    <span className="badge bg-warning">มีผู้เช่า</span>
    <div className="small text-muted">
      {room.tenantId?.name || 'ไม่ระบุ'}
    </div>
  </>
) : (
  <span className="badge bg-success">ว่าง</span>
)}
```

##### Action Buttons:
```tsx
<button
  className="btn btn-sm btn-outline-primary me-1"
  onClick={() => {
    setEditingRoom(room);
    setShowForm(true);
  }}
>
  <i className="bi bi-pencil"></i> แก้ไข
</button>
<button
  className="btn btn-sm btn-outline-danger"
  onClick={() => handleDelete(room._id, room.roomNumber)}
>
  <i className="bi bi-trash"></i> ลบ
</button>
```

---

## 🔄 Flow การทำงาน

### 1. สร้างห้องใหม่ (Create)
```
User clicks "เพิ่มห้องใหม่"
  ↓
setShowForm(true) + setEditingRoom(null)
  ↓
RoomForm แสดงในโหมด Create (ฟอร์มว่าง)
  ↓
User กรอกข้อมูลและกดบันทึก
  ↓
Validate ข้อมูล
  ↓
POST /api/rooms
  ↓
Success → รีเฟรชรายการ + ปิดฟอร์ม
Error → แสดงข้อความ error
```

### 2. แก้ไขห้อง (Edit)
```
User clicks "แก้ไข" บนแถวห้อง
  ↓
setEditingRoom(room) + setShowForm(true)
  ↓
RoomForm แสดงในโหมด Edit (มีข้อมูลเดิม)
  ↓
User แก้ไขข้อมูลและกดบันทึก
  ↓
PUT /api/rooms/[id]
  ↓
Success → รีเฟรชรายการ + ปิดฟอร์ม
```

### 3. ลบห้อง (Delete)
```
User clicks "ลบ" บนแถวห้อง
  ↓
แสดง confirmation dialog
  ↓
User ยืนยัน
  ↓
DELETE /api/rooms/[id]
  ↓
Success → รีเฟรชรายการ
```

### 4. Filter ห้อง
```
User clicks filter badge
  ↓
filterRooms(status)
  ↓
อัปเดต filteredRooms state
  ↓
Table แสดงเฉพาะห้องที่ตรงกับ filter
```

---

## 🎨 UI/UX Guidelines

### Colors & Badges:
- **ห้องว่าง**: `badge bg-success` (สีเขียว)
- **มีผู้เช่า**: `badge bg-warning` (สีเหลือง)
- **Filter ที่เลือก**: `badge bg-primary` (สีน้ำเงิน)
- **Filter ที่ไม่ได้เลือก**: `badge bg-secondary` (สีเทา)

### Buttons:
- **เพิ่มห้องใหม่**: `btn btn-primary`
- **แก้ไข**: `btn btn-sm btn-outline-primary`
- **ลบ**: `btn btn-sm btn-outline-danger`
- **บันทึก (ฟอร์ม)**: `btn btn-primary`
- **รีเซ็ต (ฟอร์ม)**: `btn btn-secondary`

### Icons (Bootstrap Icons):
- เพิ่ม: `bi bi-plus`
- แก้ไข: `bi bi-pencil`
- ลบ: `bi bi-trash`
- บ้าน/ห้อง: `bi bi-house`

### Loading States:
```tsx
{loading && (
  <div className="text-center">
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)}
```

---

## ⚠️ Error Handling

### API Errors:
```typescript
try {
  const response = await fetch('/api/rooms', { method: 'POST', ... });
  const result = await response.json();

  if (!response.ok) {
    setError(result.error || 'เกิดข้อผิดพลาด');
    return;
  }

  // success
} catch (err) {
  setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
}
```

### Common Error Messages (ภาษาไทย):
- `"กรุณากรอกหมายเลขห้อง"` - ไม่ได้กรอกเลขห้อง
- `"กรุณากรอกค่าเช่าที่ถูกต้อง"` - ค่าเช่าไม่ถูกต้อง
- `"หมายเลขห้องนี้ถูกใช้งานแล้ว"` - duplicate roomNumber
- `"ไม่สามารถลบห้องที่มีผู้เช่าอยู่"` - ลบห้องที่มีคนเช่า
- `"ไม่พบข้อมูลห้อง"` - room not found

---

## 📦 Type Definitions

### Room Interface:
```typescript
interface Room {
  _id: string;
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
  isOccupied: boolean;
  tenantId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Form Data:
```typescript
interface RoomFormData {
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
}
```

---

## ✅ Testing Checklist

### สร้างห้องใหม่:
- [ ] กรอกข้อมูลครบและบันทึกสำเร็จ
- [ ] ไม่กรอก required fields แล้วเห็น error
- [ ] ใส่ค่าติดลบและเห็น validation error
- [ ] สร้างห้องที่มีเลขซ้ำและเห็น error
- [ ] ห้องใหม่แสดงในตาราง

### แก้ไขห้อง:
- [ ] คลิกแก้ไขแล้วเห็นข้อมูลเดิมในฟอร์ม
- [ ] แก้ไขและบันทึกสำเร็จ
- [ ] ข้อมูลในตารางอัปเดตถูกต้อง

### ลบห้อง:
- [ ] คลิกลบแล้วเห็น confirmation
- [ ] ยืนยันแล้วห้องหายจากตาราง
- [ ] ยกเลิกแล้วห้องยังอยู่

### Filter:
- [ ] คลิก "ทั้งหมด" แสดงห้องทั้งหมด
- [ ] คลิก "ห้องว่าง" แสดงเฉพาะห้องว่าง
- [ ] คลิก "มีผู้เช่า" แสดงเฉพาะห้องที่มีคนเช่า
- [ ] จำนวนในแต่ละ badge ถูกต้อง

### UI/UX:
- [ ] Loading spinner แสดงขึ้นขณะโหลดข้อมูล
- [ ] Error/Success messages แสดงชัดเจน
- [ ] ตาราง responsive บน mobile
- [ ] Bootstrap styling สอดคล้องกับหน้าอื่น

---

## 🚀 Implementation Steps

1. **สร้าง RoomForm Component**
   - ไฟล์: `src/app/components/RoomForm.tsx`
   - ใช้ UserForm เป็น template
   - ปรับฟิลด์ให้ตรงกับ Room model

2. **สร้าง Admin Rooms Page**
   - ไฟล์: `src/app/admin/rooms/page.tsx`
   - Implement fetch rooms
   - สร้าง table และ integrate RoomForm

3. **Implement CRUD Operations**
   - Create: POST `/api/rooms`
   - Read: GET `/api/rooms` (โหลดตอน mount)
   - Update: PUT `/api/rooms/[id]`
   - Delete: DELETE `/api/rooms/[id]` (with confirm)

4. **Add Filter Feature**
   - Filter badges (ทั้งหมด/ว่าง/มีผู้เช่า)
   - Update filteredRooms based on selection

5. **Test Build**
   - รัน `npm run build`
   - แก้ไข errors ถ้ามี
   - ตรวจสอบ warnings

---

## 📚 Reference Files

### อ้างอิง Pattern จาก:
- **UserForm**: `src/app/components/UserForm.tsx` (form structure, validation)
- **Admin Users Page**: `src/app/admin/users/page.tsx` (CRUD, table, filter)
- **Room API**: `src/app/api/rooms/route.ts` และ `src/app/api/rooms/[id]/route.ts`
- **Room Model**: `src/models/Room.ts`
- **Room Types**: `src/types/room.ts`

---

## 📝 Notes

- ✅ API พร้อมใช้งานแล้ว ไม่ต้องแก้ backend
- ✅ ใช้ภาษาไทยในทุก UI text และ error messages
- ✅ Follow Bootstrap styling convention ที่มีอยู่
- ✅ ใช้ 'use client' directive เพราะเป็น client component
- ⚠️ **ห้าม commit เอง** - รอคำสั่งจาก Project Manager
- ⚠️ ระวัง type errors กับ Mongoose populate (ใช้ `as any` ถ้าจำเป็น)

---

**สร้างโดย:** Project Manager
**วันที่:** 2025-11-21
**Version:** 1.0
**Status:** Ready for Implementation 🚀
