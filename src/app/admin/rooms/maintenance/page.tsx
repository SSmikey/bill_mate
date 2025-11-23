'use client';

import { useState, useEffect } from 'react';
import type {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  MaintenanceFormData,
} from '@/types/maintenance';
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PRIORITY_COLORS,
} from '@/types/maintenance';

interface Room {
  _id: string;
  roomNumber: string;
  floor?: number;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<MaintenanceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    roomId: '',
    category: 'other',
    title: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    assignedTo: '',
    notes: '',
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      setError('');

      // Fetch maintenance requests
      const maintenanceResponse = await fetch('/api/maintenance');
      const maintenanceResult = await maintenanceResponse.json();

      if (!maintenanceResponse.ok) {
        throw new Error(maintenanceResult.error || 'ไม่สามารถดึงข้อมูลการแจ้งซ่อมได้');
      }

      setRequests(maintenanceResult.data || []);

      // Fetch rooms
      const roomsResponse = await fetch('/api/rooms');
      const roomsResult = await roomsResponse.json();

      if (!roomsResponse.ok) {
        throw new Error(roomsResult.error || 'ไม่สามารถดึงข้อมูลห้องได้');
      }

      setRooms(roomsResult.data || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setPageLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((r) => r.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.roomId.roomNumber.toLowerCase().includes(query) ||
          r.assignedTo?.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.roomId || !formData.title || !formData.description) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const requestBody = {
        ...formData,
        createdBy: {
          userId: 'admin-user-id', // TODO: Get from auth session
          name: 'Admin',
          role: 'admin',
        },
      };

      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถสร้างรายการแจ้งซ่อมได้');
      }

      await fetchData();
      setShowForm(false);
      resetForm();
      setSuccess('สร้างรายการแจ้งซ่อมสำเร็จ');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error creating maintenance request:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างรายการแจ้งซ่อม');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MaintenanceStatus) => {
    try {
      setError('');

      const updates: any = { status: newStatus };

      if (newStatus === 'completed') {
        updates.completedDate = new Date().toISOString();
      }

      const response = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [id],
          updates,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถอัปเดตสถานะได้');
      }

      await fetchData();
      setSuccess('อัปเดตสถานะสำเร็จ');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('ต้องการลบรายการแจ้งซ่อมนี้ใช่หรือไม่?');

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(`/api/maintenance?ids=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถลบรายการได้');
      }

      await fetchData();
      setSuccess('ลบรายการสำเร็จ');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting maintenance request:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบรายการ');
    }
  };

  const resetForm = () => {
    setFormData({
      roomId: '',
      category: 'other',
      title: '',
      description: '',
      priority: 'medium',
      scheduledDate: '',
      assignedTo: '',
      notes: '',
    });
    setEditingId(null);
  };

  // Count by status
  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    'in-progress': requests.filter((r) => r.status === 'in-progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
    cancelled: requests.filter((r) => r.status === 'cancelled').length,
  };

  // Count by priority
  const urgentCount = requests.filter((r) => r.priority === 'urgent' && r.status !== 'completed').length;

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>
                <i className="bi bi-tools me-2"></i>
                จัดการการแจ้งซ่อม
              </h2>
              <small className="text-muted">
                ทั้งหมด {requests.length} รายการ | แสดง {filteredRequests.length} รายการ
                {urgentCount > 0 && (
                  <span className="text-danger ms-2">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    เร่งด่วน {urgentCount} รายการ
                  </span>
                )}
              </small>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              disabled={showForm}
            >
              <i className="bi bi-plus-lg me-2"></i>
              แจ้งซ่อมใหม่
            </button>
          </div>

          {/* Success Alert */}
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

          {/* Form Section */}
          {showForm && (
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-wrench me-2"></i>
                  สร้างรายการแจ้งซ่อมใหม่
                </h5>

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    {/* Room Selection */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="roomId" className="form-label">
                        เลือกห้อง <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="roomId"
                        value={formData.roomId}
                        onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                        disabled={loading}
                        required
                      >
                        <option value="">-- เลือกห้อง --</option>
                        {rooms.map((room) => (
                          <option key={room._id} value={room._id}>
                            {room.roomNumber} {room.floor && `(ชั้น ${room.floor})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="category" className="form-label">
                        หมวดหมู่ <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value as MaintenanceCategory })
                        }
                        disabled={loading}
                        required
                      >
                        {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    {/* Priority */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="priority" className="form-label">
                        ระดับความสำคัญ <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        id="priority"
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData({ ...formData, priority: e.target.value as MaintenancePriority })
                        }
                        disabled={loading}
                        required
                      >
                        {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Scheduled Date */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="scheduledDate" className="form-label">
                        วันที่นัดหมาย
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="scheduledDate"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      หัวข้อ <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="เช่น ก๊อกน้ำรั่ว, หลอดไฟเสีย"
                      disabled={loading}
                      required
                      maxLength={200}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      รายละเอียด <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="อธิบายปัญหาและรายละเอียดเพิ่มเติม"
                      disabled={loading}
                      required
                      maxLength={2000}
                    ></textarea>
                  </div>

                  {/* Assigned To */}
                  <div className="mb-3">
                    <label htmlFor="assignedTo" className="form-label">
                      มอบหมายให้
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="assignedTo"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      placeholder="ชื่อช่างหรือผู้รับผิดชอบ"
                      disabled={loading}
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">
                      หมายเหตุ
                    </label>
                    <textarea
                      className="form-control"
                      id="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="บันทึกเพิ่มเติม"
                      disabled={loading}
                    ></textarea>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? (
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
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      disabled={loading}
                    >
                      <i className="bi bi-x-lg me-2"></i>
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                {/* Search */}
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="bi bi-search me-2"></i>
                    ค้นหา
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="หัวข้อ, ห้อง, ผู้รับผิดชอบ"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Status Filter */}
                <div className="col-md-3">
                  <label className="form-label">
                    <i className="bi bi-flag me-2"></i>
                    สถานะ
                  </label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
                  >
                    <option value="all">ทั้งหมด</option>
                    {Object.entries(MAINTENANCE_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="col-md-2">
                  <label className="form-label">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    ความสำคัญ
                  </label>
                  <select
                    className="form-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as MaintenancePriority | 'all')}
                  >
                    <option value="all">ทั้งหมด</option>
                    {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="col-md-3">
                  <label className="form-label">
                    <i className="bi bi-bookmark me-2"></i>
                    หมวดหมู่
                  </label>
                  <select
                    className="form-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as MaintenanceCategory | 'all')}
                  >
                    <option value="all">ทั้งหมด</option>
                    {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset Button */}
              <div className="mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCategoryFilter('all');
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  รีเซ็ตตัวกรอง
                </button>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="mb-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span
                key={status}
                className={`badge ${
                  statusFilter === status ? `bg-${MAINTENANCE_STATUS_COLORS[status as MaintenanceStatus] || 'primary'}` : 'bg-secondary'
                } me-2`}
                onClick={() => setStatusFilter(status as MaintenanceStatus | 'all')}
                style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
              >
                {status === 'all'
                  ? 'ทั้งหมด'
                  : MAINTENANCE_STATUS_LABELS[status as MaintenanceStatus]}{' '}
                ({count})
              </span>
            ))}
          </div>

          {/* Loading State */}
          {pageLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">กำลังโหลด...</span>
              </div>
              <p className="mt-3 text-muted">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="card">
                <div className="card-body">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                      <p className="mt-3 text-muted">ไม่พบรายการแจ้งซ่อม</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '100px' }}>ห้อง</th>
                            <th>หัวข้อ</th>
                            <th style={{ width: '120px' }}>หมวดหมู่</th>
                            <th style={{ width: '100px' }}>ความสำคัญ</th>
                            <th style={{ width: '120px' }}>สถานะ</th>
                            <th style={{ width: '120px' }}>วันที่แจ้ง</th>
                            <th style={{ width: '120px' }}>ผู้รับผิดชอบ</th>
                            <th className="text-center" style={{ width: '200px' }}>
                              การจัดการ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((request) => (
                            <tr key={request._id}>
                              <td>
                                <strong>{request.roomId.roomNumber}</strong>
                                {request.roomId.floor && (
                                  <div className="small text-muted">ชั้น {request.roomId.floor}</div>
                                )}
                              </td>
                              <td>
                                <div>{request.title}</div>
                                <small className="text-muted">{request.description.substring(0, 50)}...</small>
                              </td>
                              <td>
                                <span className="badge bg-info">
                                  {MAINTENANCE_CATEGORY_LABELS[request.category]}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`badge bg-${MAINTENANCE_PRIORITY_COLORS[request.priority]}`}
                                >
                                  {MAINTENANCE_PRIORITY_LABELS[request.priority]}
                                </span>
                              </td>
                              <td>
                                <select
                                  className={`form-select form-select-sm bg-${MAINTENANCE_STATUS_COLORS[request.status]}`}
                                  value={request.status}
                                  onChange={(e) =>
                                    handleUpdateStatus(request._id, e.target.value as MaintenanceStatus)
                                  }
                                >
                                  {Object.entries(MAINTENANCE_STATUS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <small>
                                  {new Date(request.reportedDate).toLocaleDateString('th-TH')}
                                </small>
                              </td>
                              <td>
                                <small>{request.assignedTo || '-'}</small>
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(request._id)}
                                  title="ลบ"
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              {filteredRequests.length > 0 && (
                <div className="mt-3 text-muted">
                  <small>
                    แสดง {filteredRequests.length} รายการ จากทั้งหมด {requests.length} รายการ
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}