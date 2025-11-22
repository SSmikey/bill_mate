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
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header">
          <h3><i className="bi bi-journal-richtext me-2"></i>บิลทั้งหมดของฉัน</h3>
          <p className="text-muted">รายการบิลค่าเช่าและค่าบริการต่างๆ</p>
        </div>
        <div className="card-body">
          {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && (
            <div className="table-responsive">
              <Table hover striped>
                <thead className="table-light">
                  <tr>
                    <th>เดือน/ปี</th>
                    <th>ยอดรวม</th>
                    <th>ครบกำหนด</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? (
                    bills.map(b => (
                      <tr key={b._id}>
                        <td>{b.month}/{b.year}</td>
                        <td>{b.totalAmount.toLocaleString()} บาท</td>
                        <td>{format(new Date(b.dueDate), 'dd MMM yy', { locale: th })}</td>
                        <td>{getBillStatusBadge(b.status)}</td>
                        <td>
                          <Link href={`/tenant/bills/${b._id}`} passHref>
                            <Button 
                              variant={b.status === 'pending' || b.status === 'overdue' ? 'primary' : 'outline-secondary'} 
                              size="sm"
                            >
                              {b.status === 'pending' || b.status === 'overdue' ? 
                                <><i className="bi bi-wallet2 me-1"></i>ชำระเงิน</> : 
                                <><i className="bi bi-search me-1"></i>ดูรายละเอียด</>}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-center py-4">ยังไม่มีรายการบิล</td></tr>
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