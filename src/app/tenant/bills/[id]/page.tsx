'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentUploadForm from '@/app/components/PaymentUploadForm';
import Link from 'next/link';

type BillStatus = 'pending' | 'paid' | 'overdue' | 'verified';
type PaymentStatus = 'pending' | 'verified' | 'rejected';

interface Bill {
  _id: string;
  month: number;
  year: number;
  totalAmount: number;
  rentAmount: number;
  waterAmount: number;
  electricityAmount: number;
  status: BillStatus;
  dueDate: string;
}

interface Payment {
  _id: string;
  status: PaymentStatus;
  createdAt: string;
  rejectionReason?: string;
  ocrData?: {
    amount?: number;
  };
}

const BillDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const billRes = await fetch(`/api/bills/${id}`);
      if (!billRes.ok) throw new Error('ไม่พบข้อมูลบิล หรือคุณไม่มีสิทธิ์เข้าถึง');
      const billData = await billRes.json();
      setBill(billData.data);

      const paymentsRes = await fetch(`/api/payments?billId=${id}`);
      if (!paymentsRes.ok) throw new Error('ไม่สามารถดึงประวัติการชำระได้');
      const paymentsData = await paymentsRes.json();
      setPayments(paymentsData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getBillStatusBadge = (status: BillStatus) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'รอชำระ' },
      paid: { bg: 'info', text: 'รอตรวจสอบ' },
      overdue: { bg: 'danger', text: 'ค้างชำระ' },
      verified: { bg: 'success', text: 'ชำระแล้ว' },
    };
    const { bg, text } = statusMap[status] || { bg: 'secondary', text: status };
    return <span className={`badge bg-${bg}`}>{text}</span>;
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'รอตรวจสอบ' },
      verified: { bg: 'success', text: 'อนุมัติแล้ว' },
      rejected: { bg: 'danger', text: 'ปฏิเสธ' },
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

  if (error) {
    return (
      <div className="fade-in">
        <button onClick={() => router.back()} className="btn btn-light mb-3">
          <i className="bi bi-arrow-left me-2"></i>กลับ
        </button>
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="fade-in">
        <button onClick={() => router.back()} className="btn btn-light mb-3">
          <i className="bi bi-arrow-left me-2"></i>กลับ
        </button>
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          ไม่พบข้อมูลบิล
        </div>
      </div>
    );
  }

  const isPaymentVerified = bill.status === 'verified';

  return (
    <div className="fade-in">
      {/* Back Button */}
      <button onClick={() => router.back()} className="btn btn-light mb-4">
        <i className="bi bi-arrow-left me-2"></i>กลับ
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h1 className="fw-bold text-dark mb-2">บิลเดือน {bill.month}/{bill.year}</h1>
            <p className="text-muted mb-0">ครบกำหนดชำระ: {new Date(bill.dueDate).toLocaleDateString('th-TH')}</p>
          </div>
          <div>{getBillStatusBadge(bill.status)}</div>
        </div>
      </div>

      {/* Bill Amount Details */}
      <div className="card border-0 bg-white rounded-3 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <h6 className="mb-0 fw-semibold text-dark">
            <i className="bi bi-receipt-text me-2 text-primary"></i>
            รายละเอียดค่าใช้จ่าย
          </h6>
        </div>
        <div className="card-body p-4">
          <div className="table-responsive">
            <table className="table table-borderless mb-0">
              <tbody>
                <tr className="border-bottom">
                  <td className="py-3">ค่าเช่า</td>
                  <td className="py-3 text-end fw-semibold">{bill.rentAmount.toLocaleString('th-TH')} บาท</td>
                </tr>
                <tr className="border-bottom">
                  <td className="py-3">ค่าน้ำ</td>
                  <td className="py-3 text-end fw-semibold">{bill.waterAmount.toLocaleString('th-TH')} บาท</td>
                </tr>
                <tr className="border-bottom">
                  <td className="py-3">ค่าไฟ</td>
                  <td className="py-3 text-end fw-semibold">{bill.electricityAmount.toLocaleString('th-TH')} บาท</td>
                </tr>
                <tr className="bg-light">
                  <td className="py-3 fw-bold">ยอดรวมทั้งหมด</td>
                  <td className="py-3 text-end fw-bold text-primary">{bill.totalAmount.toLocaleString('th-TH')} บาท</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Form or Success Alert */}
      {isPaymentVerified ? (
        <div className="card border-0 bg-success bg-opacity-10 rounded-3 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <div className="rounded-circle p-3 bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-check-circle-fill fs-2 text-success"></i>
              </div>
            </div>
            <h5 className="fw-semibold text-success text-center mb-2">ชำระเงินเรียบร้อย</h5>
            <p className="text-muted text-center small mb-4">บิลนี้ได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว</p>
            <Link href="/tenant/payments" className="btn btn-success d-block text-decoration-none">
              <i className="bi bi-arrow-right me-2"></i>
              ดูประวัติการชำระเงินทั้งหมด
            </Link>
          </div>
        </div>
      ) : (
        <PaymentUploadForm
          billId={bill._id}
          billAmount={bill.totalAmount}
          onUploadSuccess={fetchData}
        />
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="card border-0 bg-white rounded-3 shadow-sm mt-4">
          <div className="card-header bg-white border-bottom p-4 rounded-top-3">
            <h6 className="mb-0 fw-semibold text-dark">
              <i className="bi bi-clock-history me-2 text-primary"></i>
              ประวัติการชำระของบิลนี้
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush border-0">
              {payments.map(p => (
                <div key={p._id} className="list-group-item d-flex justify-content-between align-items-start p-4 border-bottom border-light">
                  <div className="flex-grow-1">
                    <div className="fw-semibold mb-2">
                      อัปโหลดเมื่อ {new Date(p.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <small className="text-muted">
                      จำนวนเงินจากสลิป: {p.ocrData?.amount ? `${p.ocrData.amount.toLocaleString('th-TH')} บาท` : 'ไม่สามารถอ่านได้'}
                      {p.ocrData?.amount && bill && p.ocrData.amount !== bill.totalAmount && (
                        <span className="badge bg-warning bg-opacity-10 text-warning ms-2">ยอดไม่ตรง</span>
                      )}
                    </small>
                    {p.status === 'rejected' && (
                      <div className="small text-danger mt-2">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        เหตุผล: {p.rejectionReason}
                      </div>
                    )}
                  </div>
                  <div className="ms-2">{getPaymentStatusBadge(p.status)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillDetailPage;