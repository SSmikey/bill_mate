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
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="fw-bold mb-1">แดชบอร์ด</h1>
          <p className="text-muted mb-0">ภาพรวมของระบบจัดการหอพัก</p>
        </div>
        <div className="text-end">
          <div className="text-muted small">อัพเดทล่าสุด</div>
          <div className="fw-semibold">
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-5">
        <div className="col-md-3 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-house-fill text-primary fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">ห้องทั้งหมด</h6>
                  <h2 className="mb-0 fw-bold">{stats?.totalRooms || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-door-closed text-success fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">ห้องว่าง</h6>
                  <h2 className="mb-0 fw-bold text-success">{(stats?.totalRooms || 0) - (stats?.occupiedRooms || 0)}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-exclamation-circle text-info fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">ค้างชำระ</h6>
                  <h2 className="mb-0 fw-bold text-info">{stats?.pendingBills || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-check-circle text-warning fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">ชำระแล้ว</h6>
                  <h2 className="mb-0 fw-bold text-warning">{stats?.paidBills || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Important Info */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="card-title mb-0 fw-semibold">
                <i className="bi bi-lightning-charge text-primary me-2"></i>
                การกระทำเร็ว
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="d-grid gap-3">
                <a href="/admin/rooms" className="btn btn-outline-primary d-flex align-items-center justify-content-center">
                  <i className="bi bi-plus-circle me-2"></i>
                  เพิ่มห้องพัก
                </a>
                <a href="/admin/bills" className="btn btn-outline-success d-flex align-items-center justify-content-center">
                  <i className="bi bi-file-earmark-plus me-2"></i>
                  สร้างบิล
                </a>
                <a href="/admin/payments" className="btn btn-outline-info d-flex align-items-center justify-content-center">
                  <i className="bi bi-check-square me-2"></i>
                  ตรวจสอบการชำระ
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="card-title mb-0 fw-semibold">
                <i className="bi bi-graph-up text-primary me-2"></i>
                ข้อมูลสำคัญ
              </h5>
            </div>
            <div className="card-body p-4">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <i className="bi bi-house-door text-muted me-2"></i>
                    <span>ห้องเช่าที่นั่ง</span>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold">{stats?.occupiedRooms || 0} ห้อง</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <i className="bi bi-receipt text-muted me-2"></i>
                    <span>บิลทั้งหมด</span>
                  </div>
                  <span className="badge bg-info bg-opacity-10 text-info fw-semibold">{stats?.totalBills || 0} รายการ</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <i className="bi bi-percent text-muted me-2"></i>
                    <span>อัตราการชำระ</span>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success fw-semibold">
                    {stats?.totalBills ? Math.round((((stats?.paidBills || 0) / stats?.totalBills) * 100)) : 0}%
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
