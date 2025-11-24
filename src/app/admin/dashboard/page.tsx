'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  totalBills: number;
  paidBills: number;
  pendingBills: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch rooms
      const roomsRes = await fetch('/api/rooms');
      const roomsData = await roomsRes.json();

      // Fetch bills
      const billsRes = await fetch('/api/bills');
      const billsData = await billsRes.json();

      const rooms = roomsData.data || [];
      const bills = billsData.data || [];

      setStats({
        totalRooms: rooms.length,
        occupiedRooms: rooms.filter((r: any) => r.isOccupied).length,
        totalBills: bills.length,
        paidBills: bills.filter((b: any) => b.status === 'verified').length,
        pendingBills: bills.filter((b: any) => b.status === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
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

  const occupancyRate = stats?.totalRooms ? Math.round(((stats.occupiedRooms / stats.totalRooms) * 100)) : 0;
  const paymentRate = stats?.totalBills ? Math.round(((stats.paidBills / stats.totalBills) * 100)) : 0;

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">แดชบอร์ด</h1>
        <p className="text-muted mb-0">ภาพรวมของระบบจัดการหอพัก</p>
      </div>

      {/* Stats Cards - Clean white background */}
      <div className="row mb-5 g-3">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ห้องทั้งหมด</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats?.totalRooms || 0}</h3>
                </div>
                <div className="rounded-circle p-3 bg-primary bg-opacity-10">
                  <i className="bi bi-house-fill fs-4 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ห้องว่าง</p>
                  <h3 className="mb-0 fw-bold text-dark">{(stats?.totalRooms || 0) - (stats?.occupiedRooms || 0)}</h3>
                </div>
                <div className="rounded-circle p-3 bg-info bg-opacity-10">
                  <i className="bi bi-door-closed fs-4 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ค้างชำระ</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats?.pendingBills || 0}</h3>
                </div>
                <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                  <i className="bi bi-exclamation-circle fs-4 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ชำระแล้ว</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats?.paidBills || 0}</h3>
                </div>
                <div className="rounded-circle p-3 bg-success bg-opacity-10">
                  <i className="bi bi-check-circle fs-4 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="row mb-5 g-3">
        <div className="col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
                  <i className="bi bi-house-door-fill fs-5 text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">อัตราการเข้าพัก</h6>
                  <p className="mb-0 small text-muted">สัดส่วนห้องที่ถูกเช่า</p>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <h3 className="mb-0 fw-bold me-3 text-primary">{occupancyRate}%</h3>
                <div className="flex-grow-1">
                  <div className="progress bg-light rounded-3" style={{ height: '8px' }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2 small">
                <span className="text-muted">{stats?.occupiedRooms || 0} ห้อง</span>
                <span className="text-muted">จาก {stats?.totalRooms || 0} ห้อง</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3 bg-success bg-opacity-10">
                  <i className="bi bi-credit-card-fill fs-5 text-success"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">อัตราการชำระเงิน</h6>
                  <p className="mb-0 small text-muted">สัดส่วนบิลที่ชำระแล้ว</p>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <h3 className="mb-0 fw-bold me-3 text-success">{paymentRate}%</h3>
                <div className="flex-grow-1">
                  <div className="progress bg-light rounded-3" style={{ height: '8px' }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${paymentRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2 small">
                <span className="text-muted">{stats?.paidBills || 0} บิล</span>
                <span className="text-muted">จาก {stats?.totalBills || 0} บิล</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Important Info */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
                  <i className="bi bi-lightning-charge-fill fs-5 text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">การกระทำเร็ว</h6>
                  <p className="mb-0 small text-muted">ทำงานที่ใช้บ่อย</p>
                </div>
              </div>
              <div className="d-grid gap-2">
                <a href="/admin/rooms" className="btn btn-primary d-flex align-items-center justify-content-center py-2 text-white text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-plus-circle-fill me-2"></i>
                  เพิ่มห้องพัก
                </a>
                <a href="/admin/bills" className="btn btn-outline-primary d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-file-earmark-plus-fill me-2"></i>
                  สร้างบิล
                </a>
                <a href="/admin/payments" className="btn btn-outline-primary d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-check-square-fill me-2"></i>
                  ตรวจสอบการชำระ
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-info bg-opacity-10">
                  <i className="bi bi-graph-up-arrow fs-5 text-info"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">ข้อมูลสำคัญ</h6>
                  <p className="mb-0 small text-muted">สถิติที่น่าสนใจ</p>
                </div>
              </div>
              <div className="list-group list-group-flush border-0">
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom border-light">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3 bg-primary bg-opacity-10">
                      <i className="bi bi-house-door-fill fs-5 text-primary"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">ห้องเช่าที่นั่ง</div>
                      <small className="text-muted">ขณะนี้</small>
                    </div>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2 py-1 rounded-2">
                    {stats?.occupiedRooms || 0}
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom border-light">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3 bg-info bg-opacity-10">
                      <i className="bi bi-receipt-cutoff fs-5 text-info"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">บิลทั้งหมด</div>
                      <small className="text-muted">เดือนนี้</small>
                    </div>
                  </div>
                  <span className="badge bg-info bg-opacity-10 text-info fw-semibold px-2 py-1 rounded-2">
                    {stats?.totalBills || 0}
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3 bg-success bg-opacity-10">
                      <i className="bi bi-cash-stack fs-5 text-success"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">รายได้ประจำเดือน</div>
                      <small className="text-muted">โดยประมาณ</small>
                    </div>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded-2">
                    ฿{(stats?.paidBills || 0) * 3000}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
