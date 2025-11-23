"use client";

import React, { useState, useEffect } from 'react';
import { Table, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Link from 'next/link';

// สมมติว่า Type เหล่านี้ถูก import มาจากไฟล์กลาง
type BillStatus = 'pending' | 'paid' | 'overdue' | 'verified';

interface Bill {
  _id: string;
  month: number;
  year: number;
  totalAmount: number;
  dueDate: string;
  status: BillStatus;
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
        // API Endpoint นี้จะ filter บิลตามผู้ใช้ที่ login โดยอัตโนมัติ
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

  const getBillStatusBadge = (status: BillStatus) => {
    const statusMap = {
      pending: { bg: 'secondary', text: 'ยังไม่ชำระ' },
      paid: { bg: 'info', text: 'ชำระแล้ว (รอตรวจสอบ)' },
      overdue: { bg: 'danger', text: 'เกินกำหนด' },
      verified: { bg: 'success', text: 'ยืนยันแล้ว' },
    };
    const { bg, text } = statusMap[status] || { bg: 'light', text: status };
    return <Badge bg={bg}>{text}</Badge>;
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-journal-richtext me-2 text-primary"></i>
            บิลทั้งหมดของฉัน
          </h2>
          <p className="text-muted mb-0">รายการบิลค่าเช่าและค่าบริการต่างๆ</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary">
            <i className="bi bi-filter me-2"></i>
            กรอง
          </button>
          <button className="btn btn-outline-primary">
            <i className="bi bi-download me-2"></i>
            ดาวน์โหลด
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-receipt text-primary"></i>
                </div>
                <div>
                  <div className="text-muted small">ทั้งหมด</div>
                  <div className="fw-bold">{bills.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-clock text-warning"></i>
                </div>
                <div>
                  <div className="text-muted small">รอชำระ</div>
                  <div className="fw-bold text-warning">{bills.filter(b => b.status === 'pending' || b.status === 'overdue').length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-hourglass-split text-info"></i>
                </div>
                <div>
                  <div className="text-muted small">รอตรวจสอบ</div>
                  <div className="fw-bold text-info">{bills.filter(b => b.status === 'paid').length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-3">
              <div className="d-flex align-items-center">
                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                  <i className="bi bi-check-circle text-success"></i>
                </div>
                <div>
                  <div className="text-muted small">ชำระแล้ว</div>
                  <div className="fw-bold text-success">{bills.filter(b => b.status === 'verified').length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" className="text-primary" />
              <p className="text-muted mt-3">กำลังโหลดข้อมูลบิล...</p>
            </div>
          )}
          {error && (
            <div className="p-4">
              <Alert variant="danger" className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            </div>
          )}
          {!loading && !error && (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="fw-semibold border-0">เดือน/ปี</th>
                    <th className="fw-semibold border-0">ยอดรวม</th>
                    <th className="fw-semibold border-0">ครบกำหนด</th>
                    <th className="fw-semibold border-0">สถานะ</th>
                    <th className="fw-semibold text-center border-0">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? (
                    bills.map(b => (
                      <tr key={b._id} className="align-middle">
                        <td>
                          <div className="fw-semibold">
                            {format(new Date(b.year, b.month - 1), 'MMMM yyyy', { locale: th })}
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold">{b.totalAmount.toLocaleString()} บาท</div>
                        </td>
                        <td>
                          <div className={new Date(b.dueDate) < new Date() && b.status !== 'verified' ? 'text-danger' : ''}>
                            {format(new Date(b.dueDate), 'dd MMM yyyy', { locale: th })}
                          </div>
                        </td>
                        <td>{getBillStatusBadge(b.status)}</td>
                        <td className="text-center">
                          <Link href={`/tenant/bills/${b._id}`} passHref>
                            <Button
                              variant={b.status === 'pending' || b.status === 'overdue' ? 'primary' : 'outline-primary'}
                              size="sm"
                              className="rounded-pill"
                            >
                              {b.status === 'pending' || b.status === 'overdue' ?
                                <><i className="bi bi-wallet2 me-1"></i>ชำระเงิน</> :
                                <><i className="bi bi-eye me-1"></i>ดูรายละเอียด</>}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                          <i className="bi bi-inbox fs-2 text-muted"></i>
                        </div>
                        <h6 className="text-muted">ยังไม่มีรายการบิล</h6>
                        <p className="text-muted small">บิลของคุณจะแสดงที่นี่เมื่อมีการสร้างบิล</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantBillsListPage;