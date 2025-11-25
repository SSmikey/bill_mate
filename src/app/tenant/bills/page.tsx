'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type BillStatus = 'pending' | 'paid' | 'overdue' | 'verified';

interface Bill {
  _id: string;
  month: number;
  year: number;
  totalAmount: number;
  dueDate: string;
  status: BillStatus;
  roomId?: { roomNumber: string };
}

const TenantBillsListPage = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/bills');
        if (!res.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลบิลของคุณได้');
        }
        const data = await res.json();
        setBills(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const getStatusBadge = (status: BillStatus) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'รอชำระ' },
      paid: { bg: 'info', text: 'รอตรวจสอบ' },
      overdue: { bg: 'danger', text: 'ค้างชำระ' },
      verified: { bg: 'success', text: 'ชำระแล้ว' },
    };
    const { bg, text } = statusMap[status] || { bg: 'secondary', text: status };
    return <span className={`badge bg-${bg}`}>{text}</span>;
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
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">บิลของฉัน</h1>
        <p className="text-muted mb-0">รายการบิลค่าเช่าและค่าบริการต่างๆ</p>
      </div>

      {/* Stats Cards */}
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
                  <i className="bi bi-receipt-fill fs-4 text-primary"></i>
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
                  <h3 className="mb-0 fw-bold text-dark">{bills.filter(b => b.status === 'pending' || b.status === 'overdue').length}</h3>
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
                  <p className="text-muted small mb-1">รอตรวจสอบ</p>
                  <h3 className="mb-0 fw-bold text-dark">{bills.filter(b => b.status === 'paid').length}</h3>
                </div>
                <div className="rounded-circle p-3 bg-info bg-opacity-10">
                  <i className="bi bi-hourglass-split fs-4 text-info"></i>
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
                  <h3 className="mb-0 fw-bold text-dark">{bills.filter(b => b.status === 'verified').length}</h3>
                </div>
                <div className="rounded-circle p-3 bg-success bg-opacity-10">
                  <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card border-0 bg-white rounded-3 shadow-sm">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <div className="d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-semibold text-dark">
              <i className="bi bi-file-text me-2 text-primary"></i>
              รายการบิลของฉัน
            </h6>
          </div>
        </div>
        <div className="card-body p-0">
          {error && (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-center mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            </div>
          )}
          {!error && (bills.length === 0 ? (
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
                    <th className="fw-semibold">ยอดรวม</th>
                    <th className="fw-semibold">ครบกำหนด</th>
                    <th className="fw-semibold">สถานะ</th>
                    <th className="fw-semibold text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b._id} className="align-middle">
                      <td>
                        <div className="fw-semibold">
                          {new Date(b.year, b.month - 1).toLocaleDateString('th-TH', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{b.roomId?.roomNumber || '-'}</span>
                      </td>
                      <td className="fw-bold">{b.totalAmount.toLocaleString('th-TH')} บาท</td>
                      <td>
                        <div className={new Date(b.dueDate) < new Date() && b.status !== 'verified' ? 'text-danger' : ''}>
                          {new Date(b.dueDate).toLocaleDateString('th-TH')}
                        </div>
                      </td>
                      <td>{getStatusBadge(b.status)}</td>
                      <td className="text-center">
                        {(b.status === 'pending' || b.status === 'overdue') && (
                          <Link href={`/tenant/bills/${b._id}`} className="btn btn-sm btn-primary rounded-pill text-decoration-none">
                            <i className="bi bi-wallet2 me-1"></i>
                            ชำระเงิน
                          </Link>
                        )}
                        {(b.status === 'verified' || b.status === 'paid') && (
                          <Link href={`/tenant/bills/${b._id}`} className="btn btn-sm btn-outline-primary rounded-pill text-decoration-none">
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default TenantBillsListPage;