'use client';

import { useState, useEffect } from 'react';

// Interface สำหรับข้อมูลห้อง
interface RoomFormData {
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
}

// Interface สำหรับ Props ของ Component
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

export default function RoomForm({
  initialData,
  onSubmit,
  isLoading = false,
  isEditing = false,
}: RoomFormProps) {
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: '',
    floor: undefined,
    rentPrice: 0,
    waterPrice: 0,
    electricityPrice: 0,
  });

  // State สำหรับเก็บข้อความ error/success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // โหลดข้อมูลเริ่มต้นถ้ามี (สำหรับโหมดแก้ไข)
  useEffect(() => {
    if (initialData) {
      setFormData({
        roomNumber: initialData.roomNumber,
        floor: initialData.floor,
        rentPrice: initialData.rentPrice,
        waterPrice: initialData.waterPrice,
        electricityPrice: initialData.electricityPrice,
      });
    }
  }, [initialData]);

  // ฟังก์ชันตรวจสอบข้อมูล
  const validateForm = (): string | null => {
    if (!formData.roomNumber.trim()) {
      return 'กรุณากรอกหมายเลขห้อง';
    }
    if (!formData.rentPrice || formData.rentPrice < 0) {
      return 'กรุณากรอกค่าเช่าที่ถูกต้อง';
    }
    if (!formData.waterPrice || formData.waterPrice < 0) {
      return 'กรุณากรอกค่าน้ำที่ถูกต้อง';
    }
    if (!formData.electricityPrice || formData.electricityPrice < 0) {
      return 'กรุณากรอกค่าไฟที่ถูกต้อง';
    }
    return null;
  };

  // ฟังก์ชันจัดการการ submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ตรวจสอบข้อมูล
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onSubmit(formData);
      setSuccess(isEditing ? 'แก้ไขข้อมูลห้องสำเร็จ' : 'เพิ่มห้องใหม่สำเร็จ');
      
      // รีเซ็ตฟอร์มถ้าเป็นโหมดสร้างใหม่
      if (!isEditing) {
        handleReset();
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // ฟังก์ชันรีเซ็ตฟอร์ม
  const handleReset = () => {
    setFormData({
      roomNumber: '',
      floor: undefined,
      rentPrice: 0,
      waterPrice: 0,
      electricityPrice: 0,
    });
    setError('');
    setSuccess('');
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูล
  const handleChange = (field: keyof RoomFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // ล้าง error เมื่อ user เริ่มพิมพ์
    if (error) setError('');
    if (success) setSuccess('');
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">
          <i className="bi bi-house me-2"></i>
          {isEditing ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องใหม่'}
        </h5>

        {/* Alert สำหรับแสดง Error/Success */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
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
            <i className="bi bi-check-circle me-2"></i>
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* หมายเลขห้อง */}
            <div className="col-md-6 mb-3">
              <label htmlFor="roomNumber" className="form-label">
                หมายเลขห้อง <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => handleChange('roomNumber', e.target.value)}
                placeholder="เช่น 101, A-201"
                disabled={isLoading}
                required
              />
            </div>

            {/* ชั้น */}
            <div className="col-md-6 mb-3">
              <label htmlFor="floor" className="form-label">
                ชั้น
              </label>
              <input
                type="number"
                className="form-control"
                id="floor"
                value={formData.floor || ''}
                onChange={(e) =>
                  handleChange('floor', e.target.value ? parseInt(e.target.value) : undefined as any)
                }
                placeholder="เช่น 1, 2, 3"
                min="0"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="row">
            {/* ค่าเช่า */}
            <div className="col-md-6 mb-3">
              <label htmlFor="rentPrice" className="form-label">
                ค่าเช่า (บาท) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                id="rentPrice"
                value={formData.rentPrice}
                onChange={(e) => handleChange('rentPrice', parseFloat(e.target.value) || 0)}
                placeholder="เช่น 3000"
                min="0"
                step="0.01"
                disabled={isLoading}
                required
              />
            </div>

            {/* ค่าน้ำ */}
            <div className="col-md-6 mb-3">
              <label htmlFor="waterPrice" className="form-label">
                ค่าน้ำ (บาท) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                id="waterPrice"
                value={formData.waterPrice}
                onChange={(e) => handleChange('waterPrice', parseFloat(e.target.value) || 0)}
                placeholder="เช่น 150"
                min="0"
                step="0.01"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="row">
            {/* ค่าไฟ */}
            <div className="col-md-6 mb-3">
              <label htmlFor="electricityPrice" className="form-label">
                ค่าไฟ (บาท) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                id="electricityPrice"
                value={formData.electricityPrice}
                onChange={(e) =>
                  handleChange('electricityPrice', parseFloat(e.target.value) || 0)
                }
                placeholder="เช่น 600"
                min="0"
                step="0.01"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* ปุ่ม Submit และ Reset */}
          <div className="d-flex gap-2">
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
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  บันทึก
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              รีเซ็ต
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}