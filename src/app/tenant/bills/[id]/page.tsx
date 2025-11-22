"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PaymentUploadForm from '@/app/components/PaymentUploadForm';
import { Spinner, Alert, Badge, Card, Table, Button } from 'react-bootstrap';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Link from 'next/link';

// สมมติว่า Type เหล่านี้ถูก import มาจากไฟล์กลาง
// src/types/bill.ts & src/types/payment.ts
type BillStatus = 'pending' | 'paid' | 'overdue' | 'verified';
type PaymentStatus = "pending" | "verified" | "rejected";

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
      // 1. Fetch bill details
      const billRes = await fetch(`/api/bills/${id}`);
      if (!billRes.ok) throw new Error('ไม่พบข้อมูลบิล หรือคุณไม่มีสิทธิ์เข้าถึง');
      const billData = await billRes.json();
      setBill(billData.data);

      // 2. Fetch payments for this bill
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
      pending: { bg: 'secondary', text: 'ยังไม่ชำระ' },
      paid: { bg: 'info', text: 'ชำระแล้ว (รอตรวจสอบ)' },
      overdue: { bg: 'danger', text: 'เกินกำหนด' },
      verified: { bg: 'success', text: 'ยืนยันแล้ว' },
    };
    const { bg, text } = statusMap[status] || { bg: 'light', text: status };
    return <Badge bg={bg}>{text}</Badge>;
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusMap = {
      pending: { bg: 'warning', text: 'รอตรวจสอบ' },
      verified: { bg: 'success', text: 'อนุมัติแล้ว' },
      rejected: { bg: 'danger', text: 'ปฏิเสธ' },
    };
    const { bg, text } = statusMap[status] || { bg: 'light', text: status };
    return <Badge bg={bg} text={bg === 'warning' ? 'dark' : 'white'}>{text}</Badge>;
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!bill) return <Alert variant="warning" className="m-3">ไม่พบข้อมูลบิล</Alert>;

  const isPaymentVerified = bill.status === 'verified';

  return (
    <div className="container-fluid mt-4">
      <Button variant="light" onClick={() => router.back()} className="mb-3">
        <i className="bi bi-arrow-left me-2"></i>กลับ
      </Button>
      <div className="row">
        <div className="col-lg-7 mb-4">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h3><i className="bi bi-receipt me-2"></i>บิลเดือน {bill.month}/{bill.year}</h3>
                {getBillStatusBadge(bill.status)}
              </div>
              <p className="text-muted mb-0">
                ครบกำหนดชำระ: {format(new Date(bill.dueDate), 'dd MMM yyyy', { locale: th })}
              </p>
            </Card.Header>
            <Card.Body>
              <h5>รายละเอียดค่าใช้จ่าย</h5>
              <Table borderless striped>
                <tbody>
                  <tr><td>ค่าเช่า</td><td className="text-end">{bill.rentAmount.toLocaleString()} บาท</td></tr>
                  <tr><td>ค่าน้ำ</td><td className="text-end">{bill.waterAmount.toLocaleString()} บาท</td></tr>
                  <tr><td>ค่าไฟ</td><td className="text-end">{bill.electricityAmount.toLocaleString()} บาท</td></tr>
                </tbody>
                <tfoot>
                  <tr className="fw-bold fs-5 table-light">
                    <td>ยอดรวมทั้งหมด</td>
                    <td className="text-end">{bill.totalAmount.toLocaleString()} บาท</td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>

          {payments.length > 0 && (
            <Card className="mt-4">
              <Card.Header><h5><i className="bi bi-clock-history me-2"></i>ประวัติการชำระของบิลนี้</h5></Card.Header>
              <Card.Body>
                <ul className="list-group list-group-flush">
                  {payments.map(p => (
                    <li key={p._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        อัปโหลดเมื่อ {format(new Date(p.createdAt), "dd MMM yy, HH:mm", { locale: th })}
                        <br />
                        <small className="text-muted">จำนวนเงินจากสลิป: {p.ocrData?.amount?.toLocaleString() ?? 'N/A'} บาท</small>
                        {p.status === 'rejected' && <div className="small text-danger">เหตุผล: {p.rejectionReason}</div>}
                      </div>
                      {getPaymentStatusBadge(p.status)}
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </div>

        <div className="col-lg-5 mb-4">
          {isPaymentVerified ? (
            <Alert variant="success">
              <Alert.Heading><i className="bi bi-check-circle-fill me-2"></i>ชำระเงินเรียบร้อย</Alert.Heading>
              <p>บิลนี้ได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว</p>
              <hr />
              <Link href="/tenant/payments" passHref>
                <Button variant="outline-success">ดูประวัติการชำระเงินทั้งหมด</Button>
              </Link>
            </Alert>
          ) : (
            <PaymentUploadForm
              billId={bill._id}
              billAmount={bill.totalAmount}
              onUploadSuccess={fetchData} // เมื่ออัปโหลดสำเร็จ ให้ดึงข้อมูลใหม่ทั้งหมด
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BillDetailPage;