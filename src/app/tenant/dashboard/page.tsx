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
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Welcome Section */}
      <div className="mb-5">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="fw-bold mb-2">สวัสดี, {session?.user?.name}</h1>
            <p className="text-muted mb-0">
              <i className="bi bi-house-door me-2"></i>
              ห้องของคุณ: <span className="badge bg-primary bg-opacity-10 text-primary">รอดึงข้อมูล</span>
            </p>
          </div>
          <div className="text-end">
            <div className="text-muted small">วันนี้</div>
            <div className="fw-semibold">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-5">
        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-receipt text-primary fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">บิลทั้งหมด</h6>
                  <h2 className="mb-0 fw-bold">{bills.length}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-check-circle text-success fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">ชำระแล้ว</h6>
                  <h2 className="mb-0 fw-bold text-success">{bills.filter(b => b.status === 'verified').length}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                  <i className="bi bi-clock text-warning fs-4"></i>
                </div>
                <div className="flex-grow-1">
                  <h6 className="text-muted mb-1">รอชำระ</h6>
                  <h2 className="mb-0 fw-bold text-warning">{bills.filter(b => b.status === 'pending').length}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom p-4">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0 fw-semibold">
              <i className="bi bi-file-text me-2 text-primary"></i>
              บิลของฉัน
            </h5>
            <Link href="/tenant/bills" className="btn btn-sm btn-outline-primary rounded-pill">
              ดูทั้งหมด
              <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          {bills.length === 0 ? (
            <div className="text-center py-5">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3 w-5rem h-5rem">
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
