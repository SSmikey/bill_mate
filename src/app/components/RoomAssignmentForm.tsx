'use client';

import { useState, useEffect } from 'react';

interface Room {
  _id: string;
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
}

interface Tenant {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  idCard?: string;
}

interface RoomAssignmentFormProps {
  room: Room;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AssignmentData {
  tenantId: string;
  moveInDate: string;
  rentDueDate: number;
  depositAmount: number;
  notes?: string;
}

export default function RoomAssignmentForm({ room, onSuccess, onCancel }: RoomAssignmentFormProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTenants, setFetchingTenants] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<AssignmentData>({
    tenantId: '',
    moveInDate: new Date().toISOString().split('T')[0],
    rentDueDate: 1,
    depositAmount: room.rentPrice,
    notes: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch available tenants
  useEffect(() => {
    fetchAvailableTenants();
  }, []);

  const fetchAvailableTenants = async () => {
    try {
      setFetchingTenants(true);
      setError('');

      const response = await fetch('/api/users?role=tenant&available=true');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลผู้เช่าได้');
      }

      setTenants(result.data || []);
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้เช่า');
    } finally {
      setFetchingTenants(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.tenantId) {
      errors.tenantId = 'กรุณาเลือกผู้เช่า';
    }

    if (!formData.moveInDate) {
      errors.moveInDate = 'กรุณาเลือกวันที่เข้าพัก';
    }

    if (formData.rentDueDate < 1 || formData.rentDueDate > 31) {
      errors.rentDueDate = 'วันที่ครบกำหนดต้องอยู่ระหว่าง 1-31';
    }

    if (formData.depositAmount < 0) {
      errors.depositAmount = 'จำนวนเงินมัดจำต้องไม่ติดลบ';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('กรุณาตรวจสอบข้อมูลให้ถูกต้อง');
      return;
    }

    const confirmed = window.confirm(
      `ต้องการมอบหมายห้อง ${room.roomNumber} ให้กับผู้เช่าที่เลือก ใช่หรือไม่?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/rooms/${room._id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถมอบหมายห้องได้');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error assigning room:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการมอบหมายห้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AssignmentData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }

    if (error) setError('');
  };

  const selectedTenant = tenants.find((t) => t._id === formData.tenantId);

  return (
    <div className="card border-primary">
      <div className="card-header bg-primary text-white">
        <h5 className="card-title mb-0">
          <i className="bi bi-person-plus-fill me-2"></i>
          มอบหมายผู้เช่าเข้าห้อง {room.roomNumber}
        </h5>
      </div>
      <div className="card-body">
        {/* Room Info */}
        <div className="alert alert-info">
          <h6>
            <i className="bi bi-house me-2"></i>
            ข้อมูลห้อง
          </h6>
          <div className="row">
            <div className="col-md-6">
              <small>
                <strong>หมายเลขห้อง:</strong> {room.roomNumber}
              </small>
            </div>
            <div className="col-md-6">
              <small>
                <strong>ชั้น:</strong> {room.floor || '-'}
              </small>
            </div>
            <div className="col-md-6">
              <small>
                <strong>ค่าเช่า:</strong> {room.rentPrice.toLocaleString('th-TH')} ฿/เดือน
              </small>
            </div>
            <div className="col-md-6">
              <small>
                <strong>ค่าน้ำ:</strong> {room.waterPrice.toLocaleString('th-TH')} ฿/เดือน
              </small>
            </div>
            <div className="col-md-6">
              <small>
                <strong>ค่าไฟ:</strong> {room.electricityPrice.toLocaleString('th-TH')} ฿/หน่วย
              </small>
            </div>
          </div>
        </div>

        {/* Error Alert */}
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

        {/* Loading Tenants */}
        {fetchingTenants ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
            <p className="mt-2 text-muted">กำลังโหลดรายชื่อผู้เช่า...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Tenant Selection */}
            <div className="mb-3">
              <label htmlFor="tenantId" className="form-label">
                เลือกผู้เช่า <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select ${fieldErrors.tenantId ? 'is-invalid' : ''}`}
                id="tenantId"
                value={formData.tenantId}
                onChange={(e) => handleChange('tenantId', e.target.value)}
                disabled={loading || tenants.length === 0}
                required
              >
                <option value="">-- เลือกผู้เช่า --</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name} ({tenant.email})
                  </option>
                ))}
              </select>
              {fieldErrors.tenantId && (
                <div className="invalid-feedback">{fieldErrors.tenantId}</div>
              )}
              {tenants.length === 0 && !fetchingTenants && (
                <div className="form-text text-warning">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  ไม่มีผู้เช่าว่างในระบบ กรุณาเพิ่มผู้เช่าก่อน
                </div>
              )}
            </div>

            {/* Selected Tenant Info */}
            {selectedTenant && (
              <div className="alert alert-success">
                <h6>
                  <i className="bi bi-person-check-fill me-2"></i>
                  ข้อมูลผู้เช่าที่เลือก
                </h6>
                <div>
                  <strong>ชื่อ:</strong> {selectedTenant.name}
                </div>
                <div>
                  <strong>อีเมล:</strong> {selectedTenant.email}
                </div>
                {selectedTenant.phone && (
                  <div>
                    <strong>เบอร์โทร:</strong> {selectedTenant.phone}
                  </div>
                )}
                {selectedTenant.idCard && (
                  <div>
                    <strong>เลขบัตรประชาชน:</strong> {selectedTenant.idCard}
                  </div>
                )}
              </div>
            )}

            <div className="row">
              {/* Move-in Date */}
              <div className="col-md-6 mb-3">
                <label htmlFor="moveInDate" className="form-label">
                  วันที่เข้าพัก <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${fieldErrors.moveInDate ? 'is-invalid' : ''}`}
                  id="moveInDate"
                  value={formData.moveInDate}
                  onChange={(e) => handleChange('moveInDate', e.target.value)}
                  disabled={loading}
                  required
                />
                {fieldErrors.moveInDate && (
                  <div className="invalid-feedback">{fieldErrors.moveInDate}</div>
                )}
              </div>

              {/* Rent Due Date */}
              <div className="col-md-6 mb-3">
                <label htmlFor="rentDueDate" className="form-label">
                  วันที่ครบกำหนดชำระค่าเช่า <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.rentDueDate ? 'is-invalid' : ''}`}
                  id="rentDueDate"
                  value={formData.rentDueDate}
                  onChange={(e) => handleChange('rentDueDate', parseInt(e.target.value))}
                  placeholder="เช่น 1, 5, 15"
                  min="1"
                  max="31"
                  disabled={loading}
                  required
                />
                {fieldErrors.rentDueDate && (
                  <div className="invalid-feedback">{fieldErrors.rentDueDate}</div>
                )}
                <div className="form-text">
                  <i className="bi bi-info-circle me-1"></i>
                  วันที่ของเดือน (1-31) เช่น 1 = วันที่ 1 ของทุกเดือน
                </div>
              </div>
            </div>

            {/* Deposit Amount */}
            <div className="mb-3">
              <label htmlFor="depositAmount" className="form-label">
                จำนวนเงินมัดจำ (บาท) <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="number"
                  className={`form-control ${fieldErrors.depositAmount ? 'is-invalid' : ''}`}
                  id="depositAmount"
                  value={formData.depositAmount}
                  onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
                  placeholder="เช่น 3000"
                  min="0"
                  step="0.01"
                  disabled={loading}
                  required
                />
                <span className="input-group-text">฿</span>
                {fieldErrors.depositAmount && (
                  <div className="invalid-feedback">{fieldErrors.depositAmount}</div>
                )}
              </div>
              <div className="form-text">
                <i className="bi bi-info-circle me-1"></i>
                ค่าเริ่มต้น = ค่าเช่า 1 เดือน ({room.rentPrice.toLocaleString('th-TH')} ฿)
              </div>
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label htmlFor="notes" className="form-label">
                หมายเหตุ
              </label>
              <textarea
                className="form-control"
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="บันทึกเพิ่มเติม เช่น เงื่อนไขพิเศษ, อุปกรณ์ในห้อง"
                disabled={loading}
              ></textarea>
            </div>

            {/* Summary */}
            <div className="card bg-light mb-3">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="bi bi-clipboard-check me-2"></i>
                  สรุปการมอบหมายห้อง
                </h6>
                <ul className="mb-0">
                  <li>
                    <strong>ห้อง:</strong> {room.roomNumber} {room.floor && `(ชั้น ${room.floor})`}
                  </li>
                  <li>
                    <strong>ผู้เช่า:</strong> {selectedTenant?.name || '(ยังไม่ได้เลือก)'}
                  </li>
                  <li>
                    <strong>วันที่เข้าพัก:</strong>{' '}
                    {new Date(formData.moveInDate).toLocaleDateString('th-TH')}
                  </li>
                  <li>
                    <strong>วันครบกำหนดชำระ:</strong> วันที่ {formData.rentDueDate} ของทุกเดือน
                  </li>
                  <li>
                    <strong>เงินมัดจำ:</strong> {formData.depositAmount.toLocaleString('th-TH')} ฿
                  </li>
                  <li>
                    <strong>ค่าเช่ารายเดือน:</strong> {room.rentPrice.toLocaleString('th-TH')} ฿
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || tenants.length === 0}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    ยืนยันการมอบหมาย
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                <i className="bi bi-x-lg me-2"></i>
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}