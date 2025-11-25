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

// Validation rules
const VALIDATION_RULES = {
  roomNumber: {
    minLength: 1,
    maxLength: 20,
    pattern: /^[A-Za-z0-9\-]+$/,
    message: 'หมายเลขห้องต้องเป็นตัวอักษร ตัวเลข หรือ - เท่านั้น',
  },
  floor: {
    min: 0,
    max: 100,
    message: 'ชั้นต้องอยู่ระหว่าง 0-100',
  },
  rentPrice: {
    min: 0,
    max: 1000000,
    message: 'ค่าเช่าต้องอยู่ระหว่าง 0-1,000,000 บาท',
  },
  waterPrice: {
    min: 0,
    max: 10000,
    message: 'ค่าน้ำต้องอยู่ระหว่าง 0-10,000 บาท',
  },
  electricityPrice: {
    min: 0,
    max: 100,
    message: 'ค่าไฟต้องอยู่ระหว่าง 0-100 บาท/หน่วย',
  },
};

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // State สำหรับ touched fields
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  // Real-time validation
  const validateField = (field: keyof RoomFormData, value: any): string | null => {
    switch (field) {
      case 'roomNumber':
        const roomNumberStr = value?.toString() || '';
        if (!roomNumberStr || !roomNumberStr.trim()) {
          return 'กรุณากรอกหมายเลขห้อง';
        }
        if (roomNumberStr.length < VALIDATION_RULES.roomNumber.minLength) {
          return 'หมายเลขห้องต้องมีอย่างน้อย 1 ตัวอักษร';
        }
        if (roomNumberStr.length > VALIDATION_RULES.roomNumber.maxLength) {
          return `หมายเลขห้องต้องไม่เกิน ${VALIDATION_RULES.roomNumber.maxLength} ตัวอักษร`;
        }
        if (!VALIDATION_RULES.roomNumber.pattern.test(roomNumberStr)) {
          return VALIDATION_RULES.roomNumber.message;
        }
        break;

      case 'floor':
        if (value !== undefined && value !== '') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return 'ชั้นต้องเป็นตัวเลข';
          }
          if (numValue < VALIDATION_RULES.floor.min || numValue > VALIDATION_RULES.floor.max) {
            return VALIDATION_RULES.floor.message;
          }
        }
        break;

      case 'rentPrice':
        const rentPriceNum = Number(value);
        if (isNaN(rentPriceNum) || rentPriceNum < 0) {
          return 'กรุณากรอกค่าเช่าที่ถูกต้อง';
        }
        if (rentPriceNum > VALIDATION_RULES.rentPrice.max) {
          return VALIDATION_RULES.rentPrice.message;
        }
        break;

      case 'waterPrice':
        const waterPriceNum = Number(value);
        if (isNaN(waterPriceNum) || waterPriceNum < 0) {
          return 'กรุณากรอกค่าน้ำที่ถูกต้อง';
        }
        if (waterPriceNum > VALIDATION_RULES.waterPrice.max) {
          return VALIDATION_RULES.waterPrice.message;
        }
        break;

      case 'electricityPrice':
        const electricityPriceNum = Number(value);
        if (isNaN(electricityPriceNum) || electricityPriceNum < 0) {
          return 'กรุณากรอกค่าไฟต่อหน่วยที่ถูกต้อง';
        }
        if (electricityPriceNum > VALIDATION_RULES.electricityPrice.max) {
          return VALIDATION_RULES.electricityPrice.message;
        }
        break;
    }

    return null;
  };

  // ฟังก์ชันตรวจสอบข้อมูลทั้งหมด
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    Object.keys(formData).forEach((key) => {
      const field = key as keyof RoomFormData;
      const fieldError = validateField(field, formData[field]);
      if (fieldError) {
        errors[field] = fieldError;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ฟังก์ชันจัดการการ submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // ตรวจสอบข้อมูล
    if (!validateForm()) {
      setError('กรุณาแก้ไขข้อมูลที่ไม่ถูกต้อง');
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
    setFieldErrors({});
    setTouched({});
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูล
  const handleChange = (field: keyof RoomFormData, value: string | number) => {
    // ถ้าเป็น number field และค่าเริ่มต้นเป็น 0 ให้เคลียร์ค่าเก่า
    const numericValue = typeof value === 'string' ? (value === '' ? 0 : parseFloat(value)) : value;

    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(numericValue as number) ? 0 : numericValue,
    }));

    // Validate on change if field was touched
    if (touched[field]) {
      const fieldError = validateField(field, value);
      setFieldErrors((prev) => ({
        ...prev,
        [field]: fieldError || '',
      }));
    }

    // ล้าง global error เมื่อ user เริ่มพิมพ์
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Handle blur event
  const handleBlur = (field: keyof RoomFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, formData[field]);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: fieldError || '',
    }));
  };

  // Calculate estimated monthly cost (excluding electricity as it's charged per unit)
  const estimatedMonthlyCost =
    formData.rentPrice + formData.waterPrice; // Only rent and water are fixed monthly costs

  return (
    <div className="card border-0 bg-white rounded-3 shadow-sm">
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="card-body p-4">
        <div className="d-flex align-items-center mb-4">
          <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
            <i className="bi bi-house-fill fs-4 text-primary"></i>
          </div>
          <div>
            <h5 className="mb-1 fw-semibold text-dark">
              {isEditing ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องใหม่'}
            </h5>
            <p className="mb-0 text-muted small">
              {isEditing ? 'ปรับเปลี่ยนแปลงข้อมูลห้อง' : 'กรอกข้อมูลห้องใหม่ในระบบ'}
            </p>
          </div>
        </div>

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

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            {/* หมายเลขห้อง */}
            <div className="col-md-6 mb-3">
              <label htmlFor="roomNumber" className="form-label fw-semibold text-dark">
                หมายเลขห้อง <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                className={`form-control rounded-2 bg-white ${
                  touched.roomNumber && fieldErrors.roomNumber ? 'is-invalid' : ''
                } ${touched.roomNumber && !fieldErrors.roomNumber && formData.roomNumber ? 'is-valid' : ''}`}
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => handleChange('roomNumber', e.target.value)}
                onBlur={() => handleBlur('roomNumber')}
                placeholder="เช่น 101, A-201, B12"
                disabled={isLoading}
                required
                style={{ color: '#000' }}
              />
              {touched.roomNumber && fieldErrors.roomNumber && (
                <div className="invalid-feedback">{fieldErrors.roomNumber}</div>
              )}
              <div className="form-text">
                <i className="bi bi-info-circle me-1 text-muted"></i>
                ใช้ตัวอักษร ตัวเลข หรือ - เท่านั้น (ไม่เกิน 20 ตัวอักษร)
              </div>
            </div>

            {/* ชั้น */}
            <div className="col-md-6 mb-3">
              <label htmlFor="floor" className="form-label fw-semibold text-dark">
                ชั้น
              </label>
              <input
                type="number"
                className={`form-control rounded-2 bg-white ${
                  touched.floor && fieldErrors.floor ? 'is-invalid' : ''
                } ${touched.floor && !fieldErrors.floor && formData.floor !== undefined ? 'is-valid' : ''}`}
                id="floor"
                value={formData.floor || ''}
                onChange={(e) =>
                  handleChange('floor', e.target.value ? parseInt(e.target.value) : (undefined as any))
                }
                onBlur={() => handleBlur('floor')}
                placeholder="เช่น 1, 2, 3"
                min="0"
                max="100"
                disabled={isLoading}
                style={{ color: '#000' }}
              />
              {touched.floor && fieldErrors.floor && (
                <div className="invalid-feedback">{fieldErrors.floor}</div>
              )}
              <div className="form-text">
                <i className="bi bi-info-circle me-1 text-muted"></i>
                ระบุชั้นของห้อง (0-100) หรือเว้นว่างไว้
              </div>
            </div>
          </div>

          <div className="row g-3">
            {/* ค่าเช่า */}
            <div className="col-md-6 mb-3">
              <label htmlFor="rentPrice" className="form-label fw-semibold text-dark">
                ค่าเช่า (บาท/เดือน) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control rounded-2 bg-white ${
                    touched.rentPrice && fieldErrors.rentPrice ? 'is-invalid' : ''
                  } ${touched.rentPrice && !fieldErrors.rentPrice && formData.rentPrice > 0 ? 'is-valid' : ''}`}
                  id="rentPrice"
                  value={formData.rentPrice === 0 ? '' : formData.rentPrice}
                  onChange={(e) => handleChange('rentPrice', e.target.value)}
                  onBlur={() => handleBlur('rentPrice')}
                  placeholder="เช่น 3000, 5000"
                  min="0"
                  max="1000000"
                  step="0.01"
                  disabled={isLoading}
                  required
                  style={{ color: '#000' }}
                />
                <span className="input-group-text">฿</span>
                {touched.rentPrice && fieldErrors.rentPrice && (
                  <div className="invalid-feedback">{fieldErrors.rentPrice}</div>
                )}
              </div>
              {formData.rentPrice > 0 && (
                <div className="form-text text-success">
                  <i className="bi bi-cash me-1"></i>
                  {formData.rentPrice.toLocaleString('th-TH')} บาทต่อเดือน
                </div>
              )}
            </div>

            {/* ค่าน้ำ */}
            <div className="col-md-6 mb-3">
              <label htmlFor="waterPrice" className="form-label fw-semibold text-dark">
                ค่าน้ำ (บาท/เดือน) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control rounded-2 bg-white ${
                    touched.waterPrice && fieldErrors.waterPrice ? 'is-invalid' : ''
                  } ${touched.waterPrice && !fieldErrors.waterPrice && formData.waterPrice > 0 ? 'is-valid' : ''}`}
                  id="waterPrice"
                  value={formData.waterPrice === 0 ? '' : formData.waterPrice}
                  onChange={(e) => handleChange('waterPrice', e.target.value)}
                  onBlur={() => handleBlur('waterPrice')}
                  placeholder="เช่น 120, 150, 200"
                  min="0"
                  max="10000"
                  step="0.01"
                  disabled={isLoading}
                  required
                  style={{ color: '#000' }}
                />
                <span className="input-group-text">฿</span>
                {touched.waterPrice && fieldErrors.waterPrice && (
                  <div className="invalid-feedback">{fieldErrors.waterPrice}</div>
                )}
              </div>
              <div className="form-text">
                <i className="bi bi-droplet-fill me-1 text-muted"></i>
                ค่าน้ำแบบเหมาจ่ายต่อเดือน (ไม่คิดตามหน่วย)
              </div>
            </div>
          </div>

          <div className="row g-3">
            {/* ค่าไฟต่อหน่วย */}
            <div className="col-md-6 mb-3">
              <label htmlFor="electricityPrice" className="form-label fw-semibold text-dark">
                ค่าไฟต่อหน่วย (บาท/หน่วย) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control rounded-2 bg-white ${
                    touched.electricityPrice && fieldErrors.electricityPrice ? 'is-invalid' : ''
                  } ${
                    touched.electricityPrice &&
                    !fieldErrors.electricityPrice &&
                    formData.electricityPrice > 0
                      ? 'is-valid'
                      : ''
                  }`}
                  id="electricityPrice"
                  value={formData.electricityPrice === 0 ? '' : formData.electricityPrice}
                  onChange={(e) =>
                    handleChange('electricityPrice', e.target.value)
                  }
                  onBlur={() => handleBlur('electricityPrice')}
                  placeholder="เช่น 8, 10, 12"
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={isLoading}
                  required
                  style={{ color: '#000' }}
                />
                <span className="input-group-text">฿/หน่วย</span>
                {touched.electricityPrice && fieldErrors.electricityPrice && (
                  <div className="invalid-feedback">{fieldErrors.electricityPrice}</div>
                )}
              </div>
              <div className="form-text">
                <i className="bi bi-lightning-charge-fill me-1 text-muted"></i>
                กรอกราคาต่อหน่วย (จะคำนวณจากการใช้จริงในแต่ละเดือน)
              </div>
              {formData.electricityPrice > 0 && (
                <div className="form-text text-info">
                  <i className="bi bi-calculator me-1"></i>
                  ตัวอย่าง: ใช้ 50 หน่วย = {(formData.electricityPrice * 50).toLocaleString('th-TH')}{' '}
                  บาท/เดือน
                </div>
              )}
            </div>

            {/* Estimated Cost Summary */}
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold text-dark">
                <i className="bi bi-calculator-fill me-2"></i>
                ประมาณการค่าใช้จ่ายต่อเดือน
              </label>
              <div className="card border-0 bg-light rounded-3">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">ค่าเช่า:</span>
                    <strong className="text-dark">{formData.rentPrice.toLocaleString('th-TH')} ฿</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">ค่าน้ำ:</span>
                    <strong className="text-dark">{formData.waterPrice.toLocaleString('th-TH')} ฿</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">ค่าไฟต่อหน่วย:</span>
                    <strong className="text-dark">
                      {formData.electricityPrice.toLocaleString('th-TH')} ฿/หน่วย
                    </strong>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="text-primary">รวมประมาณการ:</strong>
                    <strong className="text-primary fs-5">
                      {estimatedMonthlyCost.toLocaleString('th-TH')} ฿
                    </strong>
                  </div>
                  <small className="text-muted d-block mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    * ค่าไฟคิดตามจำนวนหน่วยที่ใช้จริงในแต่ละเดือน
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* ปุ่ม Submit และ Reset */}
          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary rounded-2" disabled={isLoading}>
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
                  {isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มห้องใหม่'}
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary rounded-2"
              onClick={handleReset}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              รีเซ็ต
            </button>

            <button
              type="button"
              className="btn btn-outline-primary rounded-2"
              onClick={() => {
                const allFieldsEmpty = Object.values(formData).every(
                  (val) => val === '' || val === 0 || val === undefined
                );
                if (allFieldsEmpty) {
                  alert('ฟอร์มว่างเปล่าแล้ว');
                  return;
                }
                const values = `
หมายเลขห้อง: ${formData.roomNumber || '-'}
ชั้น: ${formData.floor || '-'}
ค่าเช่า: ${formData.rentPrice.toLocaleString('th-TH')} บาท
ค่าน้ำ: ${formData.waterPrice.toLocaleString('th-TH')} บาท
ค่าไฟ: ${formData.electricityPrice.toLocaleString('th-TH')} บาท/หน่วย
ประมาณการต่อเดือน: ${estimatedMonthlyCost.toLocaleString('th-TH')} บาท
                `.trim();
                alert('ข้อมูลในฟอร์ม:\n\n' + values);
              }}
              disabled={isLoading}
            >
              <i className="bi bi-eye me-2"></i>
              แสดงข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}