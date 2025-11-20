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
    <div>
      <div className="mb-4">
        <h2 className="fw-bold">สวัสดี, {session?.user?.name}</h2>
        <p className="text-muted">ห้องของคุณ: <span className="badge bg-primary">รอดึงข้อมูล</span></p>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm bg-light">
            <div className="card-body">
              <h6 className="card-title text-muted">บิลทั้งหมด</h6>
              <h2 className="mb-0">{bills.length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm bg-success bg-opacity-10">
            <div className="card-body">
              <h6 className="card-title text-success">ชำระแล้ว</h6>
              <h2 className="mb-0 text-success">{bills.filter(b => b.status === 'verified').length}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card border-0 shadow-sm bg-warning bg-opacity-10">
            <div className="card-body">
              <h6 className="card-title text-warning">รอชำระ</h6>
              <h2 className="mb-0 text-warning">{bills.filter(b => b.status === 'pending').length}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0 fw-bold">บิลของฉัน</h5>
        </div>
        <div className="card-body p-0">
          {bills.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-3 d-block mb-3"></i>
              ไม่มีบิล
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>เดือน</th>
                    <th>ห้อง</th>
                    <th>จำนวนเงิน</th>
                    <th>ครบกำหนด</th>
                    <th>สถานะ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill._id}>
                      <td>
                        <strong>
                          {new Date(bill.year, bill.month - 1).toLocaleDateString('th-TH', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </td>
                      <td>{bill.roomId.roomNumber}</td>
                      <td className="fw-bold">{bill.totalAmount.toLocaleString('th-TH')} บาท</td>
                      <td>
                        {new Date(bill.dueDate).toLocaleDateString('th-TH')}
                      </td>
                      <td>{getStatusBadge(bill.status)}</td>
                      <td>
                        {bill.status === 'pending' && (
                          <Link href={`/tenant/bills/${bill._id}`} className="btn btn-sm btn-primary">
                            ชำระเงิน
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
