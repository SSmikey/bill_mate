'use client';

import { useState, useEffect } from 'react';
import { Button, Spinner, Alert, Badge, Table, Form, Modal } from 'react-bootstrap';
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

  const renderMaintenanceForm = () => (
    <Modal show={showForm} onHide={() => { setShowForm(false); resetForm(); }} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold">
          <i className="bi bi-wrench me-2 text-primary"></i>
          สร้างรายการแจ้งซ่อมใหม่
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="row g-3">
            {/* Room Selection */}
            <div className="col-md-6">
              <Form.Label className="fw-semibold text-dark">
                เลือกห้อง <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                disabled={loading}
                required
                className="rounded-2 bg-white text-dark"
              >
                <option value="">-- เลือกห้อง --</option>
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.roomNumber} {room.floor && `(ชั้น ${room.floor})`}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Category */}
            <div className="col-md-6">
              <Form.Label className="fw-semibold text-dark">
                หมวดหมู่ <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as MaintenanceCategory })
                }
                disabled={loading}
                required
                className="rounded-2 bg-white text-dark"
              >
                {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Priority */}
            <div className="col-md-6">
              <Form.Label className="fw-semibold text-dark">
                ระดับความสำคัญ <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as MaintenancePriority })
                }
                disabled={loading}
                required
                className="rounded-2 bg-white text-dark"
              >
                {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Scheduled Date */}
            <div className="col-md-6">
              <Form.Label className="fw-semibold text-dark">
                วันที่นัดหมาย
              </Form.Label>
              <Form.Control
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                disabled={loading}
                className="rounded-2 bg-white text-dark"
              />
            </div>

            {/* Title */}
            <div className="col-12">
              <Form.Label className="fw-semibold text-dark">
                หัวข้อ <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น ก๊อกน้ำรั่ว, หลอดไฟเสีย"
                disabled={loading}
                required
                maxLength={200}
                className="rounded-2 bg-white text-dark"
              />
            </div>

            {/* Description */}
            <div className="col-12">
              <Form.Label className="fw-semibold text-dark">
                รายละเอียด <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายปัญหาและรายละเอียดเพิ่มเติม"
                disabled={loading}
                required
                maxLength={2000}
                className="rounded-2 bg-white text-dark"
              />
            </div>

            {/* Assigned To */}
            <div className="col-12">
              <Form.Label className="fw-semibold text-dark">
                มอบหมายให้
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="ชื่อช่างหรือผู้รับผิดชอบ"
                disabled={loading}
                className="rounded-2 bg-white text-dark"
              />
            </div>

            {/* Notes */}
            <div className="col-12">
              <Form.Label className="fw-semibold text-dark">
                หมายเหตุ
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="บันทึกเพิ่มเติม"
                disabled={loading}
                className="rounded-2 bg-white text-dark"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            className="rounded-2"
            onClick={() => { setShowForm(false); resetForm(); }}
            disabled={loading}
          >
            <i className="bi bi-x-lg me-2"></i>ยกเลิก
          </Button>
          <Button type="submit" variant="primary" className="rounded-2" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <i className="bi bi-save me-2"></i>
                บันทึก
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">จัดการการแจ้งซ่อม</h1>
        <p className="text-muted mb-0">
          ทั้งหมด {requests.length} รายการ | แสดง {filteredRequests.length} รายการ
          {urgentCount > 0 && (
            <span className="text-danger ms-2">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              เร่งด่วน {urgentCount} รายการ
            </span>
          )}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="primary"
                className="d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                disabled={showForm}
              >
                <i className="bi bi-plus-lg me-2"></i>
                แจ้งซ่อมใหม่
              </Button>
            </div>
          </div>
        </div>
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

      {/* Filter Section */}
      <div className="card border-0 bg-white rounded-3 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center mb-4">
            <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
              <i className="bi bi-funnel fs-5 text-primary"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">กรองข้อมูลการแจ้งซ่อม</h6>
              <p className="mb-0 small text-muted">กรองตามสถานะ ความสำคัญ หมวดหมู่ หรือค้นหา</p>
            </div>
          </div>
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-4">
              <Form.Label className="fw-semibold text-dark">
                <i className="bi bi-search me-2"></i>
                ค้นหา
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="หัวข้อ, ห้อง, ผู้รับผิดชอบ"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-2 bg-white text-dark"
              />
            </div>

            {/* Status Filter */}
            <div className="col-md-3">
              <Form.Label className="fw-semibold text-dark">
                <i className="bi bi-flag me-2"></i>
                สถานะ
              </Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
                className="rounded-2 bg-white text-dark"
              >
                <option value="all">ทั้งหมด</option>
                {Object.entries(MAINTENANCE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Priority Filter */}
            <div className="col-md-2">
              <Form.Label className="fw-semibold text-dark">
                <i className="bi bi-exclamation-circle me-2"></i>
                ความสำคัญ
              </Form.Label>
              <Form.Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as MaintenancePriority | 'all')}
                className="rounded-2 bg-white text-dark"
              >
                <option value="all">ทั้งหมด</option>
                {Object.entries(MAINTENANCE_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </div>

            {/* Category Filter */}
            <div className="col-md-3">
              <Form.Label className="fw-semibold text-dark">
                <i className="bi bi-bookmark me-2"></i>
                หมวดหมู่
              </Form.Label>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as MaintenanceCategory | 'all')}
                className="rounded-2 bg-white text-dark"
              >
                <option value="all">ทั้งหมด</option>
                {Object.entries(MAINTENANCE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="mt-4">
            <div className="d-flex gap-2 flex-wrap">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Button
                  key={status}
                  variant={
                    statusFilter === status
                      ? status === 'all'
                        ? 'dark'
                        : MAINTENANCE_STATUS_COLORS[status as MaintenanceStatus] || 'primary'
                      : 'outline-secondary'
                  }
                  size="sm"
                  className="rounded-2"
                  onClick={() => setStatusFilter(status as MaintenanceStatus | 'all')}
                >
                  <i
                    className={`bi bi-${
                      status === 'all'
                        ? 'collection'
                        : status === 'pending'
                        ? 'clock'
                        : status === 'in-progress'
                        ? 'arrow-repeat'
                        : status === 'completed'
                        ? 'check-circle'
                        : 'x-circle'
                    } me-1`}
                  ></i>
                  {status === 'all'
                    ? 'ทั้งหมด'
                    : MAINTENANCE_STATUS_LABELS[status as MaintenanceStatus]}{' '}
                  ({count})
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="mt-3">
            <Button
              variant="outline-secondary"
              size="sm"
              className="rounded-2"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
              }}
            >
              <i className="bi bi-arrow-counterclockwise me-2"></i>
              รีเซ็ตตัวกรอง
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {pageLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3 text-muted">กำลังโหลดข้อมูลการแจ้งซ่อม...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-0">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-5">
                  <div className="rounded-circle p-4 bg-light mb-3 d-inline-block">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                  </div>
                  <h5 className="text-muted">ไม่พบรายการแจ้งซ่อม</h5>
                  <p className="text-muted mt-2">
                    ลองปรับเปลี่ยนเงื่อนไขการกรองหรือสร้างรายการแจ้งซ่อมใหม่
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>ห้อง</th>
                        <th>หัวข้อ</th>
                        <th>หมวดหมู่</th>
                        <th>ความสำคัญ</th>
                        <th>สถานะ</th>
                        <th>วันที่แจ้ง</th>
                        <th>ผู้รับผิดชอบ</th>
                        <th className="text-center min-w-250px">
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
                            <Badge bg="info">
                              {MAINTENANCE_CATEGORY_LABELS[request.category]}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={MAINTENANCE_PRIORITY_COLORS[request.priority]}>
                              {MAINTENANCE_PRIORITY_LABELS[request.priority]}
                            </Badge>
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={request.status}
                              onChange={(e) =>
                                handleUpdateStatus(request._id, e.target.value as MaintenanceStatus)
                              }
                              className="rounded-2"
                            >
                              {Object.entries(MAINTENANCE_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </Form.Select>
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
                            <Button
                              variant="danger"
                              size="sm"
                              className="rounded-2"
                              onClick={() => handleDelete(request._id)}
                              title="ลบ"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
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
      {renderMaintenanceForm()}
    </div>
  );
}