'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, Badge, Spinner, Alert, Button, Form, Modal, Toast } from 'react-bootstrap';
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
  waterAmount?: number;
  electricityAmount?: number;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

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
      waterUnits: 0, // ค่าน้ำเป็นเหมาจ่าย ส่ง 0 หน่วย
      electricityUnits: Number(formData.get('electricityPrice')), // ส่งค่าไฟต่อหน่วย
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

  const openDeleteModal = (bill: Bill) => {
    setBillToDelete(bill);
    setShowDeleteModal(true);
  };

  const handleDeleteBill = async () => {
    if (!billToDelete) return;

    setDeletingId(billToDelete._id);
    try {
      const response = await fetch(`/api/bills/${billToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('ล้มเหลวในการลบบิล');
      }

      setToast({ show: true, message: 'ลบบิลเรียบร้อยแล้ว!', type: 'success' });
      setShowDeleteModal(false);
      setBillToDelete(null);
      // Refresh bills list after deletion
      const res = await fetch('/api/bills');
      const data = await res.json();
      setBills(data.data || []);

    } catch (err: any) {
      setToast({ show: true, message: err.message || 'ล้มเหลวในการลบบิล', type: 'danger' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderDeleteConfirmModal = () => (
    <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="text-danger fw-bold">
          <i className="bi bi-exclamation-triangle me-2"></i>ยืนยันการลบบิล
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <div className="mb-3">
          <i className="bi bi-trash fs-1 text-danger"></i>
        </div>
        <h5 className="mb-3">คุณต้องการลบบิลนี้หรือไม่?</h5>
        {billToDelete && (
          <div className="alert alert-light border-1 rounded-2">
            <p className="mb-1 text-muted small">บิลสำหรับ:</p>
            <p className="mb-0 fw-semibold">
              ห้อง {billToDelete.roomId.roomNumber} ({billToDelete.tenantId.name}) - {billToDelete.month}/{billToDelete.year}
            </p>
            <p className="mb-0 text-danger fw-bold mt-2">
              ยอดเงิน: {billToDelete.totalAmount.toLocaleString()} บาท
            </p>
          </div>
        )}
        <p className="text-muted small mb-0">
          การกระทำนี้ไม่สามารถยกเลิกได้ กรุณาตรวจสอบก่อนลบ
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button
          variant="outline-secondary"
          className="rounded-2"
          onClick={() => setShowDeleteModal(false)}
          disabled={deletingId !== null}
        >
          ยกเลิก
        </Button>
        <Button
          variant="danger"
          className="rounded-2"
          onClick={handleDeleteBill}
          disabled={deletingId !== null}
        >
          {deletingId ? (
            <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> กำลังลบ...</>
          ) : (
            <>ลบบิล</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const renderCreateBillModal = () => (
    <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-receipt-cutoff me-2"></i>สร้างบิลใหม่</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleCreateBill}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="roomId">
            <Form.Label className="fw-semibold text-dark">ห้อง</Form.Label>
            <Form.Select
              name="roomId"
              required
              disabled={rooms.length === 0}
              className="form-select rounded-2 bg-white text-dark"
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
            <Form.Label className="fw-semibold text-dark">สำหรับเดือน/ปี</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control 
                name="month" 
                type="number" 
                placeholder="เดือน (1-12)" 
                required 
                className="form-control rounded-2 bg-white" 
                min="1" 
                max="12" 
                defaultValue={new Date().getMonth() + 1}
                style={{ color: '#000' }}
              />
              <Form.Control 
                name="year" 
                type="number" 
                placeholder="ปี (ค.ศ.)" 
                required 
                className="form-control rounded-2 bg-white" 
                min="2020" 
                defaultValue={new Date().getFullYear()}
                style={{ color: '#000' }}
              />
            </div>
          </Form.Group>
          <Form.Group className="mb-3" controlId="waterPrice">
            <Form.Label className="fw-semibold text-dark">ค่าน้ำ (บาท/เดือน)</Form.Label>
            <Form.Control
              name="waterPrice"
              type="number"
              placeholder="0.00"
              required
              step="0.01"
              min="0"
              className="form-control rounded-2 bg-white"
              style={{ color: '#000' }}
              defaultValue={rooms.find(r => r._id === selectedRoomId)?.waterPrice || 0}
            />
            <Form.Text className="text-muted">
              {(() => {
                const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                return selectedRoom ? `ค่าน้ำแบบเหมาจ่ายรายเดือน: ${selectedRoom.waterPrice || 0} บาท` : 'กรุณาเลือกห้องเพื่อดึงค่าน้ำ';
              })()}
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="electricityUnits">
            <Form.Label className="fw-semibold text-dark">หน่วยไฟฟ้า (kWh)</Form.Label>
            <Form.Control
              name="electricityUnits"
              type="number"
              placeholder="0.00"
              required
              step="0.01"
              min="0"
              className="form-control rounded-2 bg-white"
              style={{ color: '#000' }}
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
          <Button variant="outline-secondary" className="rounded-2" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>ยกเลิก</Button>
          <Button variant="primary" className="rounded-2" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> กำลังบันทึก...</> : 'บันทึกและสร้างบิล'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">จัดการบิลทั้งหมด</h1>
        <p className="text-muted mb-0">ดูและจัดการบิลทั้งหมดในระบบ</p>
      </div>

      {/* Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <Button
                variant="outline-primary"
                className="d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                สร้างบิลใหม่
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {toast.show && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {toast.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setToast({ ...toast, show: false })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filter Section */}
      <div className="card border-0 bg-white rounded-3 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center mb-4">
            <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
              <i className="bi bi-funnel fs-5 text-primary"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">กรองตามสถานะ</h6>
              <p className="mb-0 small text-muted">กรองบิลตามสถานะที่ต้องการ</p>
            </div>
          </div>
          <Form.Group className="mb-3" controlId="statusFilter">
            <Form.Label className="fw-semibold text-dark">
              <i className="bi bi-funnel me-2"></i>
              กรองตามสถานะ
            </Form.Label>
            <Form.Select 
              className="form-select rounded-2 bg-white text-dark"
              onChange={(e) => setFilter(e.target.value as any)} 
              value={filter}
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">ยังไม่ชำระ</option>
              <option value="paid">ชำระแล้ว (รอตรวจสอบ)</option>
              <option value="verified">ยืนยันแล้ว</option>
              <option value="overdue">เกินกำหนด</option>
            </Form.Select>
          </Form.Group>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3 text-muted">กำลังโหลดข้อมูลบิล...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-0">
              {filteredBills.length === 0 ? (
                <div className="text-center py-5">
                  <div className="rounded-circle p-4 bg-light mb-3 d-inline-block">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                  </div>
                  <h5 className="text-muted">
                    {filter === 'all'
                      ? 'ยังไม่พบบิลในระบบ'
                      : filter === 'pending'
                      ? 'ไม่พบบิลที่รอการชำระ'
                      : filter === 'paid'
                      ? 'ไม่พบบิลที่ชำระแล้วแล้ว'
                      : filter === 'verified'
                      ? 'ไม่พบบิลที่ยืนยันแล้ว'
                      : 'ไม่พบบิลที่เกินกำหนด'}
                  </h5>
                  <p className="text-muted mt-2">
                    ลองปรับเปลี่ยนเงื่อนไขการกรองหรือเพิ่มบิลใหม่ในระบบ
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>เดือน/ปี</th>
                        <th>ห้อง</th>
                        <th>ผู้เช่า</th>
                        <th>ยอดรวม</th>
                        <th>ค่าน้ำ</th>
                        <th>ค่าไฟ</th>
                        <th>ครบกำหนด</th>
                        <th>สถานะ</th>
                        <th className="text-center">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map(b => (
                        <tr key={b._id}>
                          <td>{b.month}/{b.year}</td>
                          <td>{b.roomId.roomNumber}</td>
                          <td>{b.tenantId.name}</td>
                          <td>{b.totalAmount.toLocaleString()} บาท</td>
                          <td>{b.waterAmount ? b.waterAmount.toLocaleString() : 0} บาท</td>
                          <td>{b.electricityAmount ? b.electricityAmount.toLocaleString() : 0} บาท</td>
                          <td>{format(new Date(b.dueDate), 'dd MMM yy', { locale: th })}</td>
                          <td>{getBillStatusBadge(b.status)}</td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <Link href={`/admin/payments`} passHref>
                                <Button variant="outline-primary" size="sm" className="rounded-2"><i className="bi bi-search me-1"></i>ดู</Button>
                              </Link>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="rounded-2"
                                onClick={() => openDeleteModal(b)}
                                disabled={deletingId === b._id}
                              >
                                {deletingId === b._id ? (
                                  <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> ลบ</>
                                ) : (
                                  <><i className="bi bi-trash me-1"></i>ลบ</>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {renderCreateBillModal()}
      {renderDeleteConfirmModal()}
    </div>
  );
};

export default AdminBillsPage;
