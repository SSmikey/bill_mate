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
      {/* Header with gradient background */}
      <div className="bg-gradient-primary rounded-4 p-5 mb-5 shadow-lg text-white animate-slide-in-top">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="fw-bold mb-2 display-5 text-white">แดชบอร์ด</h1>
            <p className="mb-0 opacity-90 fs-5 text-white">ภาพรวมของระบบจัดการหอพัก</p>
          </div>
          <div className="text-end">
            <div className="opacity-75 small text-white">อัพเดทล่าสุด</div>
            <div className="fw-semibold fs-5 text-white">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with modern design */}
      <div className="row mb-5 g-4">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden bg-primary text-white rounded-4 shadow-lg animate-slide-in-left">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2 text-white">ห้องทั้งหมด</h6>
                  <h2 className="mb-0 fw-bold text-white">{stats?.totalRooms || 0}</h2>
                </div>
                <div className="rounded-circle p-3 bg-white bg-opacity-25">
                  <i className="bi bi-house-fill fs-3 text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden bg-primary text-white rounded-4 shadow-lg animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2 text-white">ห้องว่าง</h6>
                  <h2 className="mb-0 fw-bold text-white">{(stats?.totalRooms || 0) - (stats?.occupiedRooms || 0)}</h2>
                </div>
                <div className="rounded-circle p-3 bg-white bg-opacity-25">
                  <i className="bi bi-door-closed fs-3 text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden bg-primary text-white rounded-4 shadow-lg animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2 text-white">ค้างชำระ</h6>
                  <h2 className="mb-0 fw-bold text-white">{stats?.pendingBills || 0}</h2>
                </div>
                <div className="rounded-circle p-3 bg-white bg-opacity-25">
                  <i className="bi bi-exclamation-circle fs-3 text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden bg-primary text-white rounded-4 shadow-lg animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2 text-white">ชำระแล้ว</h6>
                  <h2 className="mb-0 fw-bold text-white">{stats?.paidBills || 0}</h2>
                </div>
                <div className="rounded-circle p-3 bg-white bg-opacity-25">
                  <i className="bi bi-check-circle fs-3 text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="row mb-5 g-4">
        <div className="col-md-6">
          <div className="info-card card border-0 h-100 bg-secondary text-white rounded-4 shadow animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3 bg-primary">
                  <i className="bi bi-house-door-fill fs-4 text-white"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-white">อัตราการเข้าพัก</h5>
                  <p className="mb-0 small text-white opacity-75">สัดส่วนห้องที่ถูกเช่า</p>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <h2 className="mb-0 fw-bold me-3 text-white">{occupancyRate}%</h2>
                <div className="flex-grow-1">
                  <div className="progress bg-primary bg-opacity-25 rounded-3" style={{ height: '10px' }}>
                    <div
                      className="progress-bar progress-bar-animated bg-light"
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <small className="text-white opacity-75">{stats?.occupiedRooms || 0} ห้อง</small>
                <small className="text-white opacity-75">จาก {stats?.totalRooms || 0} ห้อง</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="info-card card border-0 h-100 bg-secondary text-white rounded-4 shadow animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3 bg-light">
                  <i className="bi bi-credit-card-fill fs-4 text-primary"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-white">อัตราการชำระเงิน</h5>
                  <p className="mb-0 small text-white opacity-75">สัดส่วนบิลที่ชำระแล้ว</p>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <h2 className="mb-0 fw-bold me-3 text-white">{paymentRate}%</h2>
                <div className="flex-grow-1">
                  <div className="progress bg-light bg-opacity-25 rounded-3" style={{ height: '10px' }}>
                    <div
                      className="progress-bar progress-bar-animated bg-light"
                      style={{ width: `${paymentRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <small className="text-white opacity-75">{stats?.paidBills || 0} บิล</small>
                <small className="text-white opacity-75">จาก {stats?.totalBills || 0} บิล</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Important Info */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="quick-action-card card border-0 h-100 bg-light rounded-4 shadow animate-slide-in-left" style={{ animationDelay: '0.6s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-primary">
                  <i className="bi bi-lightning-charge-fill fs-4 text-white"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-dark">การกระทำเร็ว</h5>
                  <p className="mb-0 small text-muted">ทำงานที่ใช้บ่อย</p>
                </div>
              </div>
              <div className="d-grid gap-3">
                <a href="/admin/rooms" className="btn btn-primary d-flex align-items-center justify-content-center py-3 text-white text-decoration-none fw-medium rounded-3">
                  <i className="bi bi-plus-circle-fill me-2"></i>
                  เพิ่มห้องพัก
                </a>
                <a href="/admin/bills" className="btn btn-secondary d-flex align-items-center justify-content-center py-3 text-white text-decoration-none fw-medium rounded-3">
                  <i className="bi bi-file-earmark-plus-fill me-2"></i>
                  สร้างบิล
                </a>
                <a href="/admin/payments" className="btn btn-outline-primary d-flex align-items-center justify-content-center py-3 text-decoration-none fw-medium rounded-3">
                  <i className="bi bi-check-square-fill me-2"></i>
                  ตรวจสอบการชำระ
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="info-card card border-0 h-100 bg-secondary text-white rounded-4 shadow animate-slide-in-left" style={{ animationDelay: '0.7s' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-light">
                  <i className="bi bi-graph-up-arrow fs-4 text-primary"></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold text-white">ข้อมูลสำคัญ</h5>
                  <p className="mb-0 small text-white opacity-75">สถิติที่น่าสนใจ</p>
                </div>
              </div>
              <div className="list-group list-group-flush bg-transparent">
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 border-0 bg-transparent">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3 bg-primary">
                      <i className="bi bi-house-door-fill fs-4 text-white"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-white">ห้องเช่าที่นั่ง</div>
                      <small className="text-white opacity-75">ขณะนี้</small>
                    </div>
                  </div>
                  <span className="badge bg-primary text-white fw-semibold px-3 py-2 rounded-3">
                    {stats?.occupiedRooms || 0} ห้อง
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 border-0 bg-transparent">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3 bg-primary bg-opacity-75">
                      <i className="bi bi-receipt-cutoff fs-4 text-white"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-white">บิลทั้งหมด</div>
                      <small className="text-white opacity-75">เดือนนี้</small>
                    </div>
                  </div>
                  <span className="badge bg-primary bg-opacity-75 text-white fw-semibold px-3 py-2 rounded-3">
                    {stats?.totalBills || 0} รายการ
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 border-0 bg-transparent">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3 bg-light">
                      <i className="bi bi-cash-stack fs-4 text-primary"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-white">รายได้ประจำเดือน</div>
                      <small className="text-white opacity-75">โดยประมาณ</small>
                    </div>
                  </div>
                  <span className="badge bg-light text-primary fw-semibold px-3 py-2 rounded-3">
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
