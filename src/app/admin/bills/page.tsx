"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Badge, Spinner, Alert, Button, Form, Modal, Toast } from "react-bootstrap";
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

interface Room {
  _id: string;
  roomNumber: string;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
  tenantId?: {
    _id: string;
    name: string;
  };
}

const AdminBillsPage = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<BillStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'danger' }>({ show: false, message: '', type: 'success' });

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

    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms?populate=tenant');
        if (res.ok) {
          const data = await res.json();
          setRooms(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };

    fetchBills();
    fetchRooms();
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

  const handleCreateBill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const selectedRoom = rooms.find(r => r._id === formData.get('roomId'));

    const billData = {
      roomId: formData.get('roomId'),
      tenantId: selectedRoom?.tenantId?._id,
      month: Number(formData.get('month')),
      year: Number(formData.get('year')),
      waterUnits: Number(formData.get('waterUnits')),
      electricityUnits: Number(formData.get('electricityUnits')),
    };

    if (!billData.tenantId) {
      setToast({ show: true, message: 'ห้องที่เลือกยังไม่มีผู้เช่า กรุณาตรวจสอบ', type: 'danger' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'การสร้างบิลล้มเหลว');
      }

      setToast({ show: true, message: 'สร้างบิลใหม่เรียบร้อยแล้ว!', type: 'success' });
      setShowCreateModal(false);
      // Refresh bills list after creation
      const res = await fetch('/api/bills');
      const data = await res.json();
      setBills(data.data || []);

    } catch (err: any) {
      setToast({ show: true, message: err.message, type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCreateBillModal = () => (
    <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-receipt-cutoff me-2"></i>สร้างบิลใหม่</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleCreateBill}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="roomId">
            <Form.Label>ห้อง</Form.Label>
            <Form.Select
              name="roomId"
              required
              disabled={rooms.length === 0}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              <option value="">-- เลือกห้อง --</option>
              {rooms.map(room => (
                <option key={room._id} value={room._id}>
                  ห้อง {room.roomNumber} ({room.tenantId ? room.tenantId.name : 'ไม่มีผู้เช่า'})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>สำหรับเดือน/ปี</Form.Label>
            <div className="d-flex">
              <Form.Control name="month" type="number" placeholder="เดือน (1-12)" required className="me-2" min="1" max="12" defaultValue={new Date().getMonth() + 1} />
              <Form.Control name="year" type="number" placeholder="ปี (ค.ศ.)" required min="2020" defaultValue={new Date().getFullYear()} />
            </div>
          </Form.Group>
          <Form.Group className="mb-3" controlId="waterUnits">
            <Form.Label>หน่วยน้ำ (ลบ.ม.)</Form.Label>
            <Form.Control
              name="waterUnits"
              type="number"
              placeholder="0.00"
              required
              step="0.01"
              min="0"
            />
            <Form.Text className="text-muted">
              {(() => {
                const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                return selectedRoom ? `อัตราค่าน้ำ: ${selectedRoom.waterPrice || 0} บาท/ลบ.ม.` : 'กรุณาเลือกห้องเพื่อแสดงอัตราค่าน้ำ';
              })()}
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="electricityUnits">
            <Form.Label>หน่วยไฟฟ้า (kWh)</Form.Label>
            <Form.Control
              name="electricityUnits"
              type="number"
              placeholder="0.00"
              required
              step="0.01"
              min="0"
            />
            <Form.Text className="text-muted">
              {(() => {
                const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                return selectedRoom ? `อัตราค่าไฟ: ${selectedRoom.electricityPrice || 0} บาท/หน่วย` : 'กรุณาเลือกห้องเพื่อแสดงอัตราค่าไฟ';
              })()}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>ยกเลิก</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> กำลังบันทึก...</> : 'บันทึกและสร้างบิล'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3><i className="bi bi-journal-text me-2"></i>จัดการบิลทั้งหมด</h3>
              <p className="text-muted mb-0">ดูและจัดการบิลทั้งหมดในระบบ</p>
            </div>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-circle me-2"></i>สร้างบิลใหม่
            </Button>
          </div>
        </div>
        <div className="card-body">
          <Toast onClose={() => setToast({ ...toast, show: false })} show={toast.show} delay={3000} autohide bg={toast.type} className="position-fixed top-0 end-0 m-3 text-white" style={{ zIndex: 1055 }}>
            <Toast.Header closeButton={false}>
              <strong className="me-auto">{toast.type === 'success' ? 'สำเร็จ' : 'เกิดข้อผิดพลาด'}</strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
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
                             <Button variant="outline-primary" size="sm"><i className="bi bi-search me-1"></i>ดูการชำระเงิน</Button>
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
      {renderCreateBillModal()}
    </div>
  );
};

export default AdminBillsPage;
