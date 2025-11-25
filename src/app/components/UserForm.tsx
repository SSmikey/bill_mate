'use client';

import { useState, useEffect } from 'react';
import StyledSelect from './StyledSelect';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // No-op effect, but keeping structure for future use
  }, []);

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
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-start rounded-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
          <div className="flex-grow-1">{error}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-start rounded-3" role="alert">
          <i className="bi bi-check-circle-fill me-2 mt-1"></i>
          <div className="flex-grow-1">{success}</div>
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
          <label htmlFor="name" className="form-label fw-semibold text-dark">
            ชื่อ-นามสกุล <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control rounded-3 shadow-sm bg-white text-dark"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="email" className="form-label fw-semibold text-dark">
            อีเมล <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className="form-control rounded-3 shadow-sm bg-white text-dark"
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
          <label htmlFor="password" className="form-label fw-semibold text-dark">
            รหัสผ่าน {!isEditing && <span className="text-danger">*</span>}
          </label>
          <input
            type="password"
            className="form-control rounded-3 shadow-sm bg-white text-dark"
            id="password"
            name="password"
            placeholder={isEditing ? 'ปล่อยว่างถ้าไม่เปลี่ยน' : ''}
            value={formData.password || ''}
            onChange={handleChange}
            disabled={isLoading}
          />
          {isEditing && (
            <small className="text-muted form-text">
              <i className="bi bi-info-circle me-1"></i>
              ปล่อยว่างถ้าไม่ต้องการเปลี่ยน
            </small>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="phone" className="form-label fw-semibold text-dark">
            เบอร์โทรศัพท์
          </label>
          <input
            type="tel"
            className="form-control rounded-3 shadow-sm bg-white text-dark"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <StyledSelect
            value={formData.role}
            onChange={(val) => handleChange({ target: { name: 'role', value: val } } as any)}
            label="บทบาท"
            required
            disabled={isLoading}
            options={[
              { value: 'tenant', label: 'ผู้เช่า' },
              { value: 'admin', label: 'เจ้าของหอ' },
            ]}
          />
        </div>
      </div>

      <div className="d-flex gap-2 mt-4">
        <button
          type="submit"
          className="btn btn-primary rounded-3 shadow-sm px-4"
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
            <>
              <i className="bi bi-check-circle me-2"></i>
              อัพเดท
            </>
          ) : (
            <>
              <i className="bi bi-person-plus me-2"></i>
              สร้างผู้ใช้
            </>
          )}
        </button>
        <button
          type="reset"
          className="btn btn-outline-secondary rounded-3 px-4"
          disabled={isLoading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          รีเซ็ต
        </button>
      </div>
    </form>
  );
}
