'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

type PaymentStatus = 'pending' | 'verified' | 'rejected';

interface Payment {
  _id: string;
  billId: {
    _id: string;
    month: number;
    year: number;
  };
  ocrData?: {
    amount?: number;
  };
  status: PaymentStatus;
  rejectionReason?: string;
  createdAt: string;
}

const TenantPaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/payments');
        if (!res.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลประวัติการชำระเงินได้');
        }
        const data = await res.json();
        setPayments(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (filter === 'all') {
      return payments;
    }
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const getStatusBadge = (status: PaymentStatus) => {
    const statusMap: { [key in PaymentStatus]: { bg: string; text: string } } = {
      pending: { bg: 'warning', text: 'รอตรวจสอบ' },
      verified: { bg: 'success', text: 'อนุมัติแล้ว' },
      rejected: { bg: 'danger', text: 'ปฏิเสธ' },
    };
    const { bg, text } = statusMap[status] || { bg: 'secondary', text: status };
    return <span className={`badge bg-${bg}`}>{text}</span>;
  };

  const filterLabels: { [key: string]: string } = {
    all: 'ทั้งหมด',
    pending: 'รอตรวจสอบ',
    verified: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธ',
  };

  const filterColors: { [key: string]: string } = {
    all: 'dark',
    pending: 'warning',
    verified: 'success',
    rejected: 'danger',
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
        <h1 className="fw-bold text-dark mb-2">ประวัติการชำระเงิน</h1>
        <p className="text-muted mb-0">รายการชำระเงินทั้งหมดของคุณ</p>
      </div>

      {/* Stats Cards */}
      <div className="row mb-5 g-3">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ทั้งหมด</p>
                  <h3 className="mb-0 fw-bold text-dark">{payments.length}</h3>
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
                  <p className="text-muted small mb-1">รอตรวจสอบ</p>
                  <h3 className="mb-0 fw-bold text-dark">{payments.filter(p => p.status === 'pending').length}</h3>
                </div>
                <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                  <i className="bi bi-hourglass-split fs-4 text-warning"></i>
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
                  <p className="text-muted small mb-1">อนุมัติแล้ว</p>
                  <h3 className="mb-0 fw-bold text-dark">{payments.filter(p => p.status === 'verified').length}</h3>
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
                  <p className="text-muted small mb-1">ปฏิเสธ</p>
                  <h3 className="mb-0 fw-bold text-dark">{payments.filter(p => p.status === 'rejected').length}</h3>
                </div>
                <div className="rounded-circle p-3 bg-danger bg-opacity-10">
                  <i className="bi bi-x-circle-fill fs-4 text-danger"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4">
        <div className="d-flex gap-2 flex-wrap">
          {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? `btn-${filterColors[f]}` : 'btn-outline-secondary'} rounded-pill`}
            >
              <i className={`bi bi-${
                f === 'all' ? 'collection'
                  : f === 'pending' ? 'hourglass-split'
                  : f === 'verified' ? 'check2-circle'
                  : 'x-circle'
              } me-1`}></i>
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="card border-0 bg-white rounded-3 shadow-sm">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <h6 className="mb-0 fw-semibold text-dark">
            <i className="bi bi-clock-history me-2 text-primary"></i>
            รายการชำระเงิน
          </h6>
        </div>
        <div className="card-body p-0">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-5">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-inbox fs-2 text-muted"></i>
              </div>
              <h6 className="text-muted">ไม่พบรายการ</h6>
              <p className="text-muted small">
                {filter === 'all' ? 'ยังไม่มีประวัติการชำระเงิน' : `ไม่พบรายการที่${filterLabels[filter]}`}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-semibold">วันที่อัปโหลด</th>
                    <th className="fw-semibold">สำหรับบิล</th>
                    <th className="fw-semibold">จำนวนเงิน</th>
                    <th className="fw-semibold">สถานะ</th>
                    <th className="fw-semibold text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => (
                    <tr key={p._id} className="align-middle">
                      <td>
                        <div className="fw-semibold">
                          {new Date(p.createdAt).toLocaleDateString('th-TH')}
                        </div>
                        <small className="text-muted">
                          {new Date(p.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">เดือน {p.billId.month}/{p.billId.year}</span>
                      </td>
                      <td>
                        <div className="fw-bold">{p.ocrData?.amount ? `${p.ocrData.amount.toLocaleString('th-TH')} บาท` : 'ไม่สามารถอ่านได้'}</div>
                      </td>
                      <td>
                        <div className="mb-1">{getStatusBadge(p.status)}</div>
                        {p.status === 'rejected' && (
                          <small className="text-danger">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            {p.rejectionReason}
                          </small>
                        )}
                      </td>
                      <td className="text-center">
                        <Link href={`/tenant/bills/${p.billId._id}`} className="btn btn-sm btn-outline-primary rounded-pill text-decoration-none">
                          <i className="bi bi-eye me-1"></i>
                          ดูบิล
                        </Link>
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
};

export default TenantPaymentsPage;