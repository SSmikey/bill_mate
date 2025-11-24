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
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
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
      <div className="rounded-4 p-5 mb-5 animate-slide-in-top" style={{
        background: 'linear-gradient(135deg, #213555 0%, #3E5879 100%)',
        boxShadow: '0 10px 30px rgba(33, 53, 85, 0.4)',
        color: '#F5EFE7'
      }}>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="fw-bold mb-2 display-5" style={{ color: '#F5EFE7' }}>แดชบอร์ด</h1>
            <p className="mb-0 opacity-90 fs-5" style={{ color: '#F5EFE7' }}>ภาพรวมของระบบจัดการหอพัก</p>
          </div>
          <div className="text-end">
            <div className="opacity-75 small" style={{ color: '#F5EFE7' }}>อัพเดทล่าสุด</div>
            <div className="fw-semibold fs-5" style={{ color: '#F5EFE7' }}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with modern design */}
      <div className="row mb-5 g-4">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#213555',
            boxShadow: '0 10px 25px rgba(33, 53, 85, 0.4)'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2" style={{ color: '#F5EFE7' }}>ห้องทั้งหมด</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#F5EFE7' }}>{stats?.totalRooms || 0}</h2>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(245, 239, 231, 0.2)' }}>
                  <i className="bi bi-house-fill fs-3" style={{ color: '#F5EFE7' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#3E5879',
            boxShadow: '0 10px 25px rgba(62, 88, 121, 0.4)',
            animationDelay: '0.1s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2" style={{ color: '#F5EFE7' }}>ห้องว่าง</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#F5EFE7' }}>{(stats?.totalRooms || 0) - (stats?.occupiedRooms || 0)}</h2>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(245, 239, 231, 0.2)' }}>
                  <i className="bi bi-door-closed fs-3" style={{ color: '#F5EFE7' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#D8C4B6',
            boxShadow: '0 10px 25px rgba(216, 196, 182, 0.4)',
            animationDelay: '0.2s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2" style={{ color: '#213555' }}>ค้างชำระ</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#213555' }}>{stats?.pendingBills || 0}</h2>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(33, 53, 85, 0.2)' }}>
                  <i className="bi bi-exclamation-circle fs-3" style={{ color: '#213555' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card card border-0 h-100 overflow-hidden animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#F5EFE7',
            boxShadow: '0 10px 25px rgba(245, 239, 231, 0.4)',
            animationDelay: '0.3s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-2" style={{ color: '#213555' }}>ชำระแล้ว</h6>
                  <h2 className="mb-0 fw-bold" style={{ color: '#213555' }}>{stats?.paidBills || 0}</h2>
                </div>
                <div className="rounded-circle p-3" style={{ backgroundColor: 'rgba(62, 88, 121, 0.2)' }}>
                  <i className="bi bi-check-circle fs-3" style={{ color: '#3E5879' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="row mb-5 g-4">
        <div className="col-md-6">
          <div className="info-card card border-0 h-100 animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#D8C4B6',
            boxShadow: '0 5px 20px rgba(216, 196, 182, 0.4)',
            animationDelay: '0.4s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#213555' }}>
                  <i className="bi bi-house-door-fill fs-4" style={{ color: '#F5EFE7' }}></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#213555' }}>อัตราการเข้าพัก</h5>
                  <p className="mb-0 small opacity-75" style={{ color: '#213555' }}>สัดส่วนห้องที่ถูกเช่า</p>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <h2 className="mb-0 fw-bold me-3" style={{ color: '#213555' }}>{occupancyRate}%</h2>
                <div className="flex-grow-1">
                  <div className="progress" style={{ height: '10px', borderRadius: '5px', backgroundColor: 'rgba(33, 53, 85, 0.2)' }}>
                    <div
                      className="progress-bar progress-bar-animated"
                      style={{
                        width: `${occupancyRate}%`,
                        background: '#3E5879'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <small style={{ color: '#213555', opacity: '0.75' }}>{stats?.occupiedRooms || 0} ห้อง</small>
                <small style={{ color: '#213555', opacity: '0.75' }}>จาก {stats?.totalRooms || 0} ห้อง</small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="info-card card border-0 h-100 animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#3E5879',
            boxShadow: '0 5px 20px rgba(62, 88, 121, 0.4)',
            animationDelay: '0.5s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#F5EFE7' }}>
                  <i className="bi bi-credit-card-fill fs-4" style={{ color: '#3E5879' }}></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#F5EFE7' }}>อัตราการชำระเงิน</h5>
                  <p className="mb-0 small opacity-75" style={{ color: '#F5EFE7' }}>สัดส่วนบิลที่ชำระแล้ว</p>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <h2 className="mb-0 fw-bold me-3" style={{ color: '#F5EFE7' }}>{paymentRate}%</h2>
                <div className="flex-grow-1">
                  <div className="progress" style={{ height: '10px', borderRadius: '5px', backgroundColor: 'rgba(245, 239, 231, 0.2)' }}>
                    <div
                      className="progress-bar progress-bar-animated"
                      style={{
                        width: `${paymentRate}%`,
                        background: '#F5EFE7'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2">
                <small style={{ color: '#F5EFE7', opacity: '0.75' }}>{stats?.paidBills || 0} บิล</small>
                <small style={{ color: '#F5EFE7', opacity: '0.75' }}>จาก {stats?.totalBills || 0} บิล</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Important Info */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="quick-action-card card border-0 h-100 animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#D8C4B6',
            boxShadow: '0 5px 20px rgba(216, 196, 182, 0.4)',
            animationDelay: '0.6s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
              <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#213555' }}>
                <i className="bi bi-lightning-charge-fill fs-4" style={{ color: '#F5EFE7' }}></i>
              </div>
              <div>
                <h5 className="mb-0 fw-semibold" style={{ color: '#213555' }}>การกระทำเร็ว</h5>
                <p className="mb-0 small opacity-75" style={{ color: '#213555' }}>ทำงานที่ใช้บ่อย</p>
              </div>
            </div>
              <div className="d-grid gap-3">
                <a href="/admin/rooms" className="d-flex align-items-center justify-content-center py-3 text-decoration-none border rounded-3" style={{
                  borderRadius: '0.75rem',
                  backgroundColor: '#213555',
                  border: '2px solid #3E5879',
                  color: '#F5EFE7',
                  fontWeight: '500'
                }}>
                  <i className="bi bi-plus-circle-fill me-2"></i>
                  เพิ่มห้องพัก
                </a>
                <a href="/admin/bills" className="d-flex align-items-center justify-content-center py-3 text-decoration-none border rounded-3" style={{
                  borderRadius: '0.75rem',
                  backgroundColor: '#3E5879',
                  border: '2px solid #D8C4B6',
                  color: '#F5EFE7',
                  fontWeight: '500'
                }}>
                  <i className="bi bi-file-earmark-plus-fill me-2"></i>
                  สร้างบิล
                </a>
                <a href="/admin/payments" className="d-flex align-items-center justify-content-center py-3 text-decoration-none border rounded-3" style={{
                  borderRadius: '0.75rem',
                  backgroundColor: '#D8C4B6',
                  border: '2px solid #F5EFE7',
                  color: '#213555',
                  fontWeight: '500'
                }}>
                  <i className="bi bi-check-square-fill me-2"></i>
                  ตรวจสอบการชำระ
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="info-card card border-0 h-100 animate-slide-in-left" style={{
            borderRadius: '1rem',
            background: '#3E5879',
            boxShadow: '0 5px 20px rgba(62, 88, 121, 0.4)',
            animationDelay: '0.7s'
          }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3" style={{ backgroundColor: '#F5EFE7' }}>
                  <i className="bi bi-graph-up-arrow fs-4" style={{ color: '#3E5879' }}></i>
                </div>
                <div>
                  <h5 className="mb-0 fw-semibold" style={{ color: '#F5EFE7' }}>ข้อมูลสำคัญ</h5>
                  <p className="mb-0 small opacity-75" style={{ color: '#F5EFE7' }}>สถิติที่น่าสนใจ</p>
                </div>
              </div>
              <div className="list-group list-group-flush" style={{ backgroundColor: 'transparent' }}>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 border-0" style={{ backgroundColor: 'transparent' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3" style={{ backgroundColor: '#213555' }}>
                      <i className="bi bi-house-door-fill fs-4" style={{ color: '#F5EFE7' }}></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: '#F5EFE7' }}>ห้องเช่าที่นั่ง</div>
                      <small style={{ color: '#F5EFE7', opacity: '0.75' }}>ขณะนี้</small>
                    </div>
                  </div>
                  <span className="badge-modern fw-semibold px-3 py-2" style={{
                    backgroundColor: '#213555',
                    color: '#F5EFE7',
                    borderRadius: '0.5rem'
                  }}>
                    {stats?.occupiedRooms || 0} ห้อง
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 border-0" style={{ backgroundColor: 'transparent' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3" style={{ backgroundColor: '#3E5879' }}>
                      <i className="bi bi-receipt-cutoff fs-4" style={{ color: '#F5EFE7' }}></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: '#F5EFE7' }}>บิลทั้งหมด</div>
                      <small style={{ color: '#F5EFE7', opacity: '0.75' }}>เดือนนี้</small>
                    </div>
                  </div>
                  <span className="badge-modern fw-semibold px-3 py-2" style={{
                    backgroundColor: '#3E5879',
                    color: '#F5EFE7',
                    borderRadius: '0.5rem'
                  }}>
                    {stats?.totalBills || 0} รายการ
                  </span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center px-0 border-0" style={{ backgroundColor: 'transparent' }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-3" style={{ backgroundColor: '#D8C4B6' }}>
                      <i className="bi bi-cash-stack fs-4" style={{ color: '#213555' }}></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: '#F5EFE7' }}>รายได้ประจำเดือน</div>
                      <small style={{ color: '#F5EFE7', opacity: '0.75' }}>โดยประมาณ</small>
                    </div>
                  </div>
                  <span className="badge-modern fw-semibold px-3 py-2" style={{
                    backgroundColor: '#D8C4B6',
                    color: '#213555',
                    borderRadius: '0.5rem'
                  }}>
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
