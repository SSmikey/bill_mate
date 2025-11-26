'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import StyledSelect from '@/app/components/StyledSelect';

interface MaintenanceRequest {
  _id: string;
  roomId: {
    _id: string;
    roomNumber: string;
    floor?: number;
  };
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  reportedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  cost?: number;
  assignedTo?: string;
  notes?: string;
  images?: string[];
  createdBy: {
    userId: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UserRoom {
  _id: string;
  roomNumber: string;
  floor?: number;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [userRoom, setUserRoom] = useState<UserRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'other',
    title: '',
    description: '',
    priority: 'medium',
  });

  const categories = [
    { value: 'electrical', label: 'ไฟฟ้า' },
    { value: 'plumbing', label: 'ประปา' },
    { value: 'air-conditioning', label: 'แอร์' },
    { value: 'furniture', label: 'เฟอร์นิเจอร์' },
    { value: 'cleaning', label: 'ทำความสะอาด' },
    { value: 'security', label: 'ความปลอดภัย' },
    { value: 'other', label: 'อื่นๆ' },
  ];

  const priorities = [
    { value: 'low', label: 'ต่ำ', color: 'success' },
    { value: 'medium', label: 'ปานกลาง', color: 'warning' },
    { value: 'high', label: 'สูง', color: 'danger' },
    { value: 'urgent', label: 'เร่งด่วน', color: 'dark' },
  ];

  const statusLabels = {
    'pending': 'รอดำเนินการ',
    'in-progress': 'กำลังดำเนินการ',
    'completed': 'เสร็จสิ้น',
    'cancelled': 'ยกเลิก',
  };

  const statusColors = {
    'pending': 'secondary',
    'in-progress': 'primary',
    'completed': 'success',
    'cancelled': 'danger',
  };

  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchUserData();
      fetchMaintenanceRequests();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.roomId) {
          setUserRoom(data.data.roomId);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/maintenance');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter requests for current user only
          const userRequests = data.data.filter((req: MaintenanceRequest) =>
            req.createdBy.userId === session?.user?.id
          );
          setRequests(userRequests);
        }
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRoom) {
      alert('ไม่พบข้อมูลห้องพักของคุณ');
      return;
    }

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: userRoom._id,
          category: formData.category,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          createdBy: {
            userId: session?.user?.id,
            name: session?.user?.name || 'ผู้เช่า',
            role: 'tenant',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('ส่งคำขอแจ้งซ่อมเรียบร้อยแล้ว');
          setShowForm(false);
          setFormData({
            category: 'other',
            title: '',
            description: '',
            priority: 'medium',
          });
          fetchMaintenanceRequests();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'เกิดข้อผิดพลาดในการส่งคำขอ');
      }
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      alert('เกิดข้อผิดพลาดในการส่งคำขอ');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-80">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <h5 className="text-muted">กำลังโหลดข้อมูล...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="fw-bold text-dark mb-2">แจ้งซ่อมบำรุง</h1>
            <p className="text-muted mb-0">
              <i className="bi bi-house-door me-2"></i>
              {userRoom ? `ห้อง ${userRoom.roomNumber}` : 'ไม่พบข้อมูลห้องพัก'}
            </p>
          </div>
          <button
            className="btn btn-secondary rounded-3"
            onClick={() => setShowForm(!showForm)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            แจ้งซ่อมใหม่
          </button>
        </div>
      </div>

      {/* Maintenance Request Form */}
      {showForm && (
        <div className="card border-0 bg-white rounded-3 shadow-sm mb-4 fade-in">
          <div className="card-header bg-white border-bottom p-4 rounded-top-3">
            <h6 className="card-title mb-0 fw-semibold text-dark">
              <i className="bi bi-wrench me-2 text-primary"></i>
              แจ้งซ่อมบำรุงใหม่
            </h6>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <StyledSelect
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val.toString() })}
                    label="ประเภท"
                    icon="bi bi-tag"
                    options={categories.map((cat) => ({
                      value: cat.value,
                      label: cat.label,
                    }))}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <StyledSelect
                    value={formData.priority}
                    onChange={(val) => setFormData({ ...formData, priority: val.toString() })}
                    label="ความสำคัญ"
                    icon="bi bi-exclamation-triangle"
                    options={priorities.map((pri) => ({
                      value: pri.value,
                      label: pri.label,
                    }))}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-chat-left-text me-2 text-muted"></i>
                  หัวข้อ
                </label>
                <input
                  type="text"
                  className="form-control rounded-2 bg-light text-dark"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ระบุหัวข้อการแจ้งซ่อม"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold text-muted">
                  <i className="bi bi-text-paragraph me-2 text-muted"></i>
                  รายละเอียด
                </label>
                <textarea
                  className="form-control rounded-2 bg-light text-dark"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="อธิบายปัญหาที่พบโดยละเอียด"
                  rows={4}
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-warning rounded-2">
                  <i className="bi bi-send me-2"></i>
                  ส่งคำขอ
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-2"
                  onClick={() => setShowForm(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Requests List */}
      <div className="card border-0 bg-white rounded-3 shadow-sm">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <h6 className="card-title mb-0 fw-semibold text-dark">
            <i className="bi bi-clock-history me-2 text-primary"></i>
            ประวัติการแจ้งซ่อม
          </h6>
        </div>
        <div className="card-body p-0">
          {requests.length === 0 ? (
            <div className="text-center py-5">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-tools fs-2 text-muted"></i>
              </div>
              <h6 className="text-muted">ยังไม่มีประวัติการแจ้งซ่อม</h6>
              <p className="text-muted small">คำขอแจ้งซ่อมของคุณจะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-semibold border-0">วันที่แจ้ง</th>
                    <th className="fw-semibold border-0">หัวข้อ</th>
                    <th className="fw-semibold border-0">ประเภท</th>
                    <th className="fw-semibold border-0">ความสำคัญ</th>
                    <th className="fw-semibold border-0">สถานะ</th>
                    <th className="fw-semibold border-0">ผู้รับผิดชอบ</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request._id} className="align-middle">
                      <td>
                        <div className="text-muted small">
                          {formatDate(request.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{request.title}</div>
                        <small className="text-muted">
                          <i className="bi bi-house-door me-1"></i>
                          {request.roomId.roomNumber}
                          {request.roomId.floor && ` (ชั้น ${request.roomId.floor})`}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {categories.find((c) => c.value === request.category)?.label ||
                            request.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          priorities.find((p) => p.value === request.priority)?.color ||
                          'secondary'
                        }`}>
                          {priorities.find((p) => p.value === request.priority)?.label ||
                            request.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          statusColors[request.status as keyof typeof statusColors] ||
                          'secondary'
                        }`}>
                          {statusLabels[request.status as keyof typeof statusLabels] ||
                            request.status}
                        </span>
                      </td>
                      <td>
                        {request.assignedTo ? (
                          <span className="text-muted">{request.assignedTo}</span>
                        ) : (
                          <span className="text-muted">
                            <i className="bi bi-person-dash me-1"></i>
                            ยังไม่มีผู้รับผิดชอบ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}