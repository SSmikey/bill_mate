'use client';

import { useState, useEffect } from 'react';

interface Room {
  _id: string;
  roomNumber: string;
}

interface UserFormData {
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: 'admin' | 'tenant';
  roomId?: string;
}

interface UserFormProps {
  initialData?: UserFormData & { _id?: string };
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  isEditing?: boolean;
}

export default function UserForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEditing = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>(
    initialData || {
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'tenant',
      roomId: '',
    }
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();

      if (data.success) {
        setRooms(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.name) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return false;
    }

    if (!isEditing && !formData.password) {
      setError('กรุณากรอกรหัสผ่าน');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('กรุณากรอกอีเมลที่ถูกต้อง');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      setSuccess('บันทึกข้อมูลเรียบร้อยแล้ว');

      if (!isEditing) {
        setFormData({
          email: '',
          password: '',
          name: '',
          phone: '',
          role: 'tenant',
          roomId: '',
        });
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="name" className="form-label fw-bold">
            ชื่อ-นามสกุล <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="email" className="form-label fw-bold">
            อีเมล <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading || isEditing}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="password" className="form-label fw-bold">
            รหัสผ่าน {!isEditing && <span className="text-danger">*</span>}
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            placeholder={isEditing ? 'ปล่อยว่างถ้าไม่เปลี่ยน' : ''}
            value={formData.password || ''}
            onChange={handleChange}
            disabled={isLoading}
          />
          {isEditing && (
            <small className="text-muted">ปล่อยว่างถ้าไม่ต้องการเปลี่ยน</small>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="phone" className="form-label fw-bold">
            เบอร์โทรศัพท์
          </label>
          <input
            type="tel"
            className="form-control"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="role" className="form-label fw-bold">
            บทบาท <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={isLoading}
            required
          >
            <option value="tenant">ผู้เช่า</option>
            <option value="admin">เจ้าของหอ</option>
          </select>
        </div>

        {formData.role === 'tenant' && (
          <div className="col-md-6 mb-3">
            <label htmlFor="roomId" className="form-label fw-bold">
              ห้องพัก
            </label>
            <select
              className="form-select"
              id="roomId"
              name="roomId"
              value={formData.roomId || ''}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">-- เลือกห้อง --</option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomNumber}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="d-flex gap-2 mt-4">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              กำลังบันทึก...
            </>
          ) : isEditing ? (
            'อัพเดท'
          ) : (
            'สร้างผู้ใช้'
          )}
        </button>
        <button type="reset" className="btn btn-outline-secondary" disabled={isLoading}>
          รีเซ็ต
        </button>
      </div>
    </form>
  );
}
