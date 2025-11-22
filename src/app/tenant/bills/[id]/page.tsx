"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Badge, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Link from 'next/link';

// สมมติว่า Type เหล่านี้ถูก import มาจากไฟล์กลาง
type BillStatus = 'pending' | 'paid' | 'overdue' | 'verified';

interface Bill {
  _id: string;
  roomId: {
    roomNumber: string;
  };
  tenantId: {
    name: string;
  };
  month: number;
  year: number;
  totalAmount: number;
  dueDate: string;
  status: BillStatus;
}

const AdminBillsPage = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState<BillStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError('');
      try {
        // API Endpoint นี้จะดึงบิลทั้งหมดสำหรับ Admin
        const res = await fetch('/api/bills');
        if (!res.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลบิลทั้งหมดได้');
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

  const filteredBills = useMemo(() => {
    if (filter === 'all') {
      return bills;
    }
    return bills.filter((b) => b.status === filter);
  }, [bills, filter]);

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
          <h3><i className="bi bi-journal-text me-2"></i>จัดการบิลทั้งหมด</h3>
          <p className="text-muted">ดูและจัดการบิลทั้งหมดในระบบ</p>
        </div>
        <div className="card-body">
          <Form.Group className="mb-3" controlId="statusFilter">
            <Form.Label>กรองตามสถานะ</Form.Label>
            <Form.Select onChange={(e) => setFilter(e.target.value as any)} value={filter}>
              <option value="all">ทั้งหมด</option>
              <option value="pending">ยังไม่ชำระ</option>
              <option value="paid">ชำระแล้ว (รอตรวจสอบ)</option>
              <option value="verified">ยืนยันแล้ว</option>
              <option value="overdue">เกินกำหนด</option>
            </Form.Select>
          </Form.Group>

          {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && (
            <div className="table-responsive">
              <Table hover striped>
                <thead className="table-light">
                  <tr>
                    <th>เดือน/ปี</th>
                    <th>ห้อง</th>
                    <th>ผู้เช่า</th>
                    <th>ยอดรวม</th>
                    <th>ครบกำหนด</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.length > 0 ? (
                    filteredBills.map(b => (
                      <tr key={b._id}>
                        <td>{b.month}/{b.year}</td>
                        <td>{b.roomId.roomNumber}</td>
                        <td>{b.tenantId.name}</td>
                        <td>{b.totalAmount.toLocaleString()} บาท</td>
                        <td>{format(new Date(b.dueDate), 'dd MMM yy', { locale: th })}</td>
                        <td>{getBillStatusBadge(b.status)}</td>
                        <td>
                          {/* อาจจะลิงก์ไปหน้า Admin Payment ที่กรองตาม billId นี้ */}
                          <Link href={`/admin/payments`} passHref>
                             <Button variant="outline-primary" size="sm"><i className="bi bi-search me-1"></i>ดูการชำระ</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="text-center py-4">ไม่พบบิลในหมวดหมู่นี้</td></tr>
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

export default AdminBillsPage;