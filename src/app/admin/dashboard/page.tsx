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
    <div>
      <h2 className="mb-4 fw-bold">แดชบอร์ด</h2>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-white-50 mb-0">ห้องทั้งหมด</h6>
                  <h2 className="mb-0">{stats?.totalRooms || 0}</h2>
                </div>
                <i className="bi bi-house-fill" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-white-50 mb-0">ห้องว่าง</h6>
                  <h2 className="mb-0">{(stats?.totalRooms || 0) - (stats?.occupiedRooms || 0)}</h2>
                </div>
                <i className="bi bi-door-closed" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-white-50 mb-0">ค้างชำระ</h6>
                  <h2 className="mb-0">{stats?.pendingBills || 0}</h2>
                </div>
                <i className="bi bi-exclamation-circle" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title text-white-50 mb-0">ชำระแล้ว</h6>
                  <h2 className="mb-0">{stats?.paidBills || 0}</h2>
                </div>
                <i className="bi bi-check-circle" style={{ fontSize: '2.5rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">การกระทำเร็ว</h5>
              <div className="d-grid gap-2">
                <a href="/admin/rooms" className="btn btn-outline-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  เพิ่มห้องพัก
                </a>
                <a href="/admin/bills" className="btn btn-outline-success">
                  <i className="bi bi-file-earmark-plus me-2"></i>
                  สร้างบิล
                </a>
                <a href="/admin/payments" className="btn btn-outline-info">
                  <i className="bi bi-check-square me-2"></i>
                  ตรวจสอบการชำระ
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-3">ข้อมูลสำคัญ</h5>
              <div className="list-group list-group-flush">
                <div className="list-group-item">
                  <strong>ห้องเช่าที่นั่ง:</strong> {stats?.occupiedRooms || 0} ห้อง
                </div>
                <div className="list-group-item">
                  <strong>บิลทั้งหมด:</strong> {stats?.totalBills || 0} รายการ
                </div>
                <div className="list-group-item">
                  <strong>อัตราการชำระ:</strong> {stats?.totalBills ? Math.round((((stats?.paidBills || 0) / stats?.totalBills) * 100)) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
