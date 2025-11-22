"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Link from 'next/link';

// สมมติว่า Type เหล่านี้ถูก import มาจากไฟล์กลาง
// src/types/payment.ts
type PaymentStatus = "pending" | "verified" | "rejected";

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
        // API Endpoint นี้จะ filter การชำระเงินตามผู้ใช้ที่ login โดยอัตโนมัติ
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
    switch (status) {
      case "pending":
        return <Badge bg="warning text-dark">รอตรวจสอบ</Badge>;
      case "verified":
        return <Badge bg="success">อนุมัติแล้ว</Badge>;
      case "rejected":
        return <Badge bg="danger">ปฏิเสธ</Badge>;
      default:
        return <Badge bg="secondary">ไม่ทราบสถานะ</Badge>;
    }
  };

  const renderFilters = () => {
    const filters: (PaymentStatus | "all")[] = ["all", "pending", "verified", "rejected"];
    // ย้าย filterLabels ออกไปข้างนอกแล้ว
    // const filterLabels: { [key: string]: string } = {
    //   all: "ทั้งหมด",
    //   pending: "รอตรวจสอบ",
    //   verified: "อนุมัติแล้ว",
    //   rejected: "ปฏิเสธ",
    // };
    const filterColors: { [key: string]: string } = {
      all: "dark",
      pending: "warning",
      verified: "success",
      rejected: "danger",
    };

    return (
      <div className="mb-3">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter === f ? (filterColors[f] || "primary") : "outline-dark"}
            size="sm"
            className="me-2"
            onClick={() => setFilter(f)}
          >
            <i
              className={`bi bi-${
                f === "all" ? "collection"
                  : f === "pending" ? "hourglass-split"
                  : f === "verified" ? "check2-circle"
                  : "x-circle"
              } me-1`}
            ></i>
            {filterLabels[f]}
          </Button>
        ))}
      </div>
    );
  };

  const filterLabels: { [key: string]: string } = {
    all: "ทั้งหมด",
    pending: "รอตรวจสอบ",
    verified: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
  };

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header">
          <h3><i className="bi bi-clock-history me-2"></i>ประวัติการชำระเงิน</h3>
          <p className="text-muted">รายการชำระเงินทั้งหมดของคุณ</p>
        </div>
        <div className="card-body">
          {renderFilters()}
          {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && (
            <div className="table-responsive">
              <Table hover striped>
                <thead className="table-light">
                  <tr>
                    <th>วันที่อัปโหลด</th>
                    <th>สำหรับบิล</th>
                    <th>จำนวนเงิน (จากสลิป)</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map(p => (
                      <tr key={p._id}>
                        <td>{format(new Date(p.createdAt), "dd MMM yy, HH:mm", { locale: th })}</td>
                        <td>เดือน {p.billId.month}/{p.billId.year}</td>
                        <td>{p.ocrData?.amount?.toLocaleString() ?? 'N/A'} บาท</td>
                        <td>
                          {getStatusBadge(p.status)}
                          {p.status === 'rejected' && <div className="small text-danger mt-1">เหตุผล: {p.rejectionReason}</div>}
                        </td>
                        <td>
                          <Link href={`/tenant/bills/${p.billId._id}`} passHref>
                            <Button variant="link" size="sm" className="p-0"><i className="bi bi-eye me-1"></i>ดูบิล</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        {filter === 'all' ? 'ยังไม่มีประวัติการชำระเงิน' : `ไม่พบรายการที่ "${filterLabels[filter]}"`}
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

export default TenantPaymentsPage;