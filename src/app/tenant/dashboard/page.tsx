'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Bill {
  _id: string;
  month: number;
  year: number;
  roomId: { roomNumber: string };
  totalAmount: number;
  dueDate: string;
  status: string;
}

export default function TenantDashboard() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills');
      const data = await response.json();

      if (data.success) {
        setBills(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="badge bg-success">ชำระแล้ว</span>;
      case 'pending':
        return <span className="badge bg-warning">รอชำระ</span>;
      case 'overdue':
        return <span className="badge bg-danger">ค้างชำระ</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
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

  const paidBills = bills.filter(b => b.status === 'verified').length;
  const pendingBills = bills.filter(b => b.status === 'pending' || b.status === 'overdue').length;

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">สวัสดี, {session?.user?.name}</h1>
        <p className="text-muted mb-0">ภาพรวมของข้อมูลบิลและการชำระเงินของคุณ</p>
      </div>

      {/* Stats Cards - Clean white background */}
      <div className="row mb-5 g-3">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">บิลทั้งหมด</p>
                  <h3 className="mb-0 fw-bold text-dark">{bills.length}</h3>
                </div>
                <div className="rounded-circle p-3 bg-primary bg-opacity-10">
                  <i className="bi bi-receipt fs-4 text-primary"></i>
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
                  <h3 className="mb-0 fw-bold text-dark">{paidBills}</h3>
                </div>
                <div className="rounded-circle p-3 bg-success bg-opacity-10">
                  <i className="bi bi-check-circle-fill fs-4 text-success"></i>
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
                  <p className="text-muted small mb-1">รอชำระ</p>
                  <h3 className="mb-0 fw-bold text-dark">{pendingBills}</h3>
                </div>
                <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                  <i className="bi bi-exclamation-circle-fill fs-4 text-warning"></i>
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
                  <p className="text-muted small mb-1">ห้องของคุณ</p>
                  <h3 className="mb-0 fw-bold text-dark">-</h3>
                </div>
                <div className="rounded-circle p-3 bg-info bg-opacity-10">
                  <i className="bi bi-house-door-fill fs-4 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Card */}
      <div className="row mb-5 g-3">
        <div className="col-lg-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
                  <i className="bi bi-bell-fill fs-5 text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">สำคัญ</h6>
                  <p className="mb-0 small text-muted">ข้อมูลที่ต้องให้ความสนใจ</p>
                </div>
              </div>
              <div className="list-group list-group-flush border-0">
                {pendingBills > 0 ? (
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom border-light">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle p-2 me-3 bg-warning bg-opacity-10">
                        <i className="bi bi-exclamation-circle-fill fs-5 text-warning"></i>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark">บิลรอชำระ</div>
                        <small className="text-muted">โปรดชำระให้ทันกำหนด</small>
                      </div>
                    </div>
                    <span className="badge bg-warning bg-opacity-10 text-warning fw-semibold px-2 py-1 rounded-2">
                      {pendingBills}
                    </span>
                  </div>
                ) : (
                  <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom border-light">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle p-2 me-3 bg-success bg-opacity-10">
                        <i className="bi bi-check-circle-fill fs-5 text-success"></i>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark">ไม่มีบิลค้างชำระ</div>
                        <small className="text-muted">ยอดเยี่ยม</small>
                      </div>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded-2">
                      ✓
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-info bg-opacity-10">
                  <i className="bi bi-lightning-charge-fill fs-5 text-info"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">การกระทำเร็ว</h6>
                  <p className="mb-0 small text-muted">ทำงานที่ใช้บ่อย</p>
                </div>
              </div>
              <div className="d-grid gap-2">
                <Link href="/tenant/bills" className="btn btn-primary d-flex align-items-center justify-content-center py-2 text-white text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-file-earmark-text-fill me-2"></i>
                  ดูบิลทั้งหมด
                </Link>
                <Link href="/tenant/payments" className="btn btn-outline-primary d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-credit-card-fill me-2"></i>
                  ประวัติการชำระ
                </Link>
                <Link href="/tenant/maintenance" className="btn btn-outline-primary d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-tools me-2"></i>
                  แจ้งซ่อมบำรุง
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="card border-0 bg-white rounded-3 shadow-sm">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-semibold text-dark">
              <i className="bi bi-file-text me-2 text-primary"></i>
              บิลล่าสุด
            </h6>
            <Link href="/tenant/bills" className="btn btn-sm btn-outline-primary rounded-pill">
              ดูทั้งหมด
              <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          {bills.length === 0 ? (
            <div className="text-center py-5">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-inbox fs-2 text-muted"></i>
              </div>
              <h6 className="text-muted">ยังไม่มีบิล</h6>
              <p className="text-muted small">บิลของคุณจะแสดงที่นี่เมื่อมีการสร้างบิล</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-semibold">เดือน</th>
                    <th className="fw-semibold">ห้อง</th>
                    <th className="fw-semibold">จำนวนเงิน</th>
                    <th className="fw-semibold">ครบกำหนด</th>
                    <th className="fw-semibold">สถานะ</th>
                    <th className="fw-semibold text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.slice(0, 5).map((bill) => (
                    <tr key={bill._id} className="align-middle">
                      <td>
                        <div className="fw-semibold">
                          {new Date(bill.year, bill.month - 1).toLocaleDateString('th-TH', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{bill.roomId.roomNumber}</span>
                      </td>
                      <td className="fw-bold">{bill.totalAmount.toLocaleString('th-TH')} บาท</td>
                      <td>
                        <div className="text-muted">
                          {new Date(bill.dueDate).toLocaleDateString('th-TH')}
                        </div>
                      </td>
                      <td>{getStatusBadge(bill.status)}</td>
                      <td className="text-center">
                        {bill.status === 'pending' && (
                          <Link href={`/tenant/bills/${bill._id}`} className="btn btn-sm btn-primary rounded-pill">
                            <i className="bi bi-wallet2 me-1"></i>
                            ชำระเงิน
                          </Link>
                        )}
                        {bill.status === 'verified' && (
                          <Link href={`/tenant/bills/${bill._id}`} className="btn btn-sm btn-outline-primary rounded-pill">
                            <i className="bi bi-eye me-1"></i>
                            ดูรายละเอียด
                          </Link>
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
