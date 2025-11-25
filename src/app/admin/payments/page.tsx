"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Spinner, Alert, Badge, Table, Form } from "react-bootstrap";
import Link from 'next/link';
import { format } from "date-fns";
import { th } from "date-fns/locale";

// สมมติว่า Type เหล่านี้ถูก import มาจากไฟล์กลาง
// src/types/payment.ts
type PaymentStatus = "pending" | "verified" | "rejected";

interface Payment {
  _id: string;
  billId: {
    _id: string;
    month: number;
    year: number;
    totalAmount: number;
    roomId: {
      _id: string;
      roomNumber: string;
    };
  };
  userId: {
    _id: string;
    name: string;
  };
  slipImageUrl: string;
  ocrData: {
    amount?: number;
    date?: string;
    time?: string;
    fromAccount?: string;
    toAccount?: string;
    reference?: string;
  };
  qrData?: {
    amount?: number;
  };
  status: PaymentStatus;
  rejectionReason?: string;
  createdAt: string;
}

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<PaymentStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // State for editing OCR data
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [editableOcrData, setEditableOcrData] = useState<Payment['ocrData'] | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments");
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลการชำระดเงินได้");
      }
      const result = await response.json();
      setPayments(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    if (filter === "all") {
      return payments;
    }
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const handleShowModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditableOcrData(JSON.parse(JSON.stringify(payment.ocrData))); // Deep copy for editing
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
    setIsEditingOcr(false); // Reset editing state on close
    setEditableOcrData(null);
  };

  const handleApprove = async () => {
    if (!selectedPayment) return;
    setIsVerifying(true);
    try {
      const response = await fetch(
        `/api/payments/${selectedPayment._id}/verify`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "การอนุมัติล้มเเหลว");
      }
      alert("อนุมัติการชำระเงินเรียบร้อยแล้ว");
      await fetchPayments();
      handleCloseModal();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    const reason = prompt("กรุณาระบุเหตุผลในการปฏิเสธ:");
    if (!reason) {
      alert("คุณต้องระบุเหตุผลในการปฏิเสธั");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await fetch(
        `/api/payments/${selectedPayment._id}/verify`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false, rejectionReason: reason }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "การปฏิเสธล้มเหลว");
      }
      alert("ปฏิเสธการชำระเงินเรียบร้อยแล้ว");
      await fetchPayments();
      handleCloseModal();
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOcrInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableOcrData) return;
    const { name, value } = e.target;
    
    // Validate input based on field type
    if (name === 'amount') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 10000000) {
        setEditableOcrData({
          ...editableOcrData,
          [name]: numValue,
        });
      } else if (value === '') {
        setEditableOcrData({
          ...editableOcrData,
          [name]: 0,
        });
      }
      // Don't update if invalid
    } else {
      // For string fields, update directly
      setEditableOcrData({
        ...editableOcrData,
        [name]: value,
      });
    }
  };

  const handleSaveOcr = async () => {
    if (!selectedPayment || !editableOcrData) return;
    
    // Validate OCR data before saving
    if (editableOcrData.amount !== undefined && editableOcrData.amount !== null) {
      if (isNaN(editableOcrData.amount) || editableOcrData.amount < 0) {
        alert('จำนวนเงินต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
        return;
      }
    }
    
    // Validate date format if provided
    if (editableOcrData.date) {
      const dateRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
      if (!dateRegex.test(editableOcrData.date)) {
        alert('รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น DD/MM/YYYY หรือ DD-MM-YYYY)');
        return;
      }
    }
    
    // Validate time format if provided
    if (editableOcrData.time) {
      const timeRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;
      if (!timeRegex.test(editableOcrData.time)) {
        alert('รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:MM หรือ HH:MM:SS)');
        return;
      }
    }
    
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/payments/${selectedPayment._id}/orc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrData: editableOcrData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'การอัปเดตข้อมูล OCR ล้มเหลว');
      }

      alert('อัปเดตข้อมูล OCR สำเร็จ');
      // Refresh data and exit edit mode
      await fetchPayments();
      setIsEditingOcr(false);
      // Manually update the selected payment to reflect changes immediately in the modal
      setSelectedPayment(prev => prev ? { ...prev, ocrData: editableOcrData } : null);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

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


  const filterLabels: { [key: string]: string } = {
    pending: "รอตรวจสอบ",
    verified: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
    all: "ทั้งหมด",
  };

  const renderVerificationModal = () => {
    if (!selectedPayment) return null;

    const billAmount = selectedPayment.billId.totalAmount;
    const ocrAmount = isEditingOcr ? editableOcrData?.amount : selectedPayment.ocrData?.amount;
    const qrAmount = selectedPayment.qrData?.amount;
    
    // Use OCR amount first, fallback to QR amount if OCR is not available
    const effectiveAmount = ocrAmount ?? qrAmount;
    const isAmountMatch =
      effectiveAmount !== undefined && effectiveAmount !== null &&
      !isNaN(effectiveAmount) && Math.abs(effectiveAmount - billAmount) < 0.01;

    return (
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <i className="bi bi-receipt-cutoff me-2 text-primary"></i>ตรวจสอบการชำระเงิน
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isVerifying && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">กำลังดำเนินการ...</p>
            </div>
          )}
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 me-2 bg-primary bg-opacity-10">
                  <i className="bi bi-image fs-5 text-primary"></i>
                </div>
                <h6 className="mb-0 fw-semibold">สลิปการชำระ</h6>
              </div>
              <div className="border rounded p-2 bg-light">
                <img
                  src={selectedPayment.slipImageUrl}
                  className="img-fluid rounded"
                  alt="Payment slip"
                  style={{
                    maxHeight: "500px",
                    width: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 me-2 bg-info bg-opacity-10">
                  <i className="bi bi-file-earmark-text fs-5 text-info"></i>
                </div>
                <h6 className="mb-0 fw-semibold">ข้อมูลบิล</h6>
              </div>
              <div className="card border-0 bg-light rounded-3 mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-muted d-block">ห้อง</small>
                      <span className="fw-semibold">{selectedPayment.billId.roomId.roomNumber}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">ผู้เช่า</small>
                      <span className="fw-semibold">{selectedPayment.userId.name}</span>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">ยอดบิล</small>
                      <span className="fw-bold text-primary fs-5">
                        {billAmount.toLocaleString("th-TH", {
                          style: "currency",
                          currency: "THB",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle p-2 me-2 bg-warning bg-opacity-10">
                    <i className="bi bi-search fs-5 text-warning"></i>
                  </div>
                  <h6 className="mb-0 fw-semibold">ข้อมูลจาก OCR</h6>
                </div>
                {!isEditingOcr && selectedPayment.status === 'pending' && (
                  <Button variant="outline-primary" size="sm" className="rounded-2" onClick={() => setIsEditingOcr(true)}>
                    <i className="bi bi-pencil-square me-1"></i> แก้ไข
                  </Button>
                )}
              </div>
              <div className="card border-0 bg-light rounded-3 mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <small className="text-muted d-block">จำนวนเงิน</small>
                      {isEditingOcr ? (
                        <input
                          type="number"
                          name="amount"
                          className="form-control form-control-sm rounded-2"
                          value={editableOcrData?.amount || ''}
                          onChange={handleOcrInputChange}
                        />
                      ) : (
                        <div className="d-flex align-items-center">
                          <span className="fw-bold fs-5">
                            {effectiveAmount !== undefined && effectiveAmount !== null && !isNaN(effectiveAmount)
                              ? effectiveAmount.toLocaleString("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                })
                              : "N/A"}
                            {!ocrAmount && qrAmount && (
                              <small className="text-muted d-block">(จาก QR Code)</small>
                            )}
                          </span>
                          {effectiveAmount !== undefined && effectiveAmount !== null && !isNaN(effectiveAmount) &&
                            (isAmountMatch ? (
                              <Badge bg="success" className="ms-2">
                                <i className="bi bi-check-circle me-1"></i>ตรงกัน
                              </Badge>
                            ) : (
                              <Badge bg="danger" className="ms-2">
                                <i className="bi bi-x-circle me-1"></i>ไม่ตรงกัน
                                <small className="d-block">
                                  ต่างกัน {Math.abs((effectiveAmount || 0) - billAmount).toLocaleString('th-TH')} บาท
                                </small>
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">วันที่-เวลา</small>
                      {isEditingOcr ? (
                        <div className="d-flex gap-2">
                          <input type="text" name="date" className="form-control form-control-sm rounded-2" value={editableOcrData?.date || ''} onChange={handleOcrInputChange} placeholder="DD/MM/YYYY" />
                          <input type="text" name="time" className="form-control form-control-sm rounded-2" value={editableOcrData?.time || ''} onChange={handleOcrInputChange} placeholder="HH:MM" />
                        </div>
                      ) : (
                        <span className="fw-semibold">
                          {selectedPayment.ocrData.date || "N/A"} - {selectedPayment.ocrData.time || "N/A"}
                        </span>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">จากบัญชี</small>
                      {isEditingOcr ? (
                        <input type="text" name="fromAccount" className="form-control form-control-sm rounded-2" value={editableOcrData?.fromAccount || ''} onChange={handleOcrInputChange} />
                      ) : (
                        <span className="fw-semibold">{selectedPayment.ocrData.fromAccount || "N/A"}</span>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">ไปบัญชี</small>
                      {isEditingOcr ? (
                        <input type="text" name="toAccount" className="form-control form-control-sm rounded-2" value={editableOcrData?.toAccount || ''} onChange={handleOcrInputChange} />
                      ) : (
                        <span className="fw-semibold">{selectedPayment.ocrData.toAccount || "N/A"}</span>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">เลขที่อ้างอิง</small>
                      {isEditingOcr ? (
                        <input type="text" name="reference" className="form-control form-control-sm rounded-2" value={editableOcrData?.reference || ''} onChange={handleOcrInputChange} />
                      ) : (
                        <span className="fw-semibold">{selectedPayment.ocrData.reference || "N/A"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {isEditingOcr && (
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="link" size="sm" onClick={() => setIsEditingOcr(false)}>ยกเลิก</Button>
                  <Button variant="primary" size="sm" className="rounded-2" onClick={handleSaveOcr} disabled={isVerifying}>
                    {isVerifying ? <><Spinner as="span" animation="border" size="sm" /> กำลังบันทึก...</> : 'บันทึก'}
                  </Button>
                </div>
              )}

              {selectedPayment.qrData && (
                <>
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle p-2 me-2 bg-success bg-opacity-10">
                      <i className="bi bi-qr-code fs-5 text-success"></i>
                    </div>
                    <h6 className="mb-0 fw-semibold">ข้อมูลจาก QR Code</h6>
                  </div>
                  <div className="card border-0 bg-light rounded-3">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <small className="text-muted d-block">จำนวนเงิน</small>
                          <span className="fw-bold">
                            {selectedPayment.qrData.amount
                              ? selectedPayment.qrData.amount.toLocaleString(
                                  "th-TH",
                                  {
                                    style: "currency",
                                    currency: "THB",
                                  }
                                )
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          {!isEditingOcr && (
            <>
              <Button
                variant="outline-secondary"
                className="rounded-2"
                onClick={handleCloseModal}
                disabled={isVerifying}
              >
                ปิด
              </Button>
              <Button
                variant="danger"
                className="rounded-2"
                onClick={handleReject}
                disabled={isVerifying || selectedPayment.status !== 'pending'}
              >
                <i className="bi bi-x-lg me-1"></i>ปฏิเสธ
              </Button>
              <Button
                variant="success"
                className="rounded-2"
                onClick={handleApprove}
                disabled={isVerifying || selectedPayment.status !== 'pending'}
                title={!isAmountMatch ? "คำเตือน: ยอดเงินไม่ตรงกับบิล" : ""}
              >
                <i className="bi bi-check-lg me-1"></i>อนุมัติ
                {!isAmountMatch && <i className="bi bi-exclamation-triangle ms-1"></i>}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">จัดการการชำระเงิน</h1>
        <p className="text-muted mb-0">ตรวจสอบและยืนยันสลิปการชำระเงินที่ผู้เช่าอัปโหลด</p>
      </div>

      {/* Action Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex gap-2 flex-wrap">
              <Link href="/admin/payments/analytics" passHref>
                <Button variant="outline-primary" className="d-flex align-items-center justify-content-center py-2 text-decoration-none fw-medium rounded-2">
                  <i className="bi bi-bar-chart-line-fill me-2"></i>
                  ดูข้อมูลวิเคราะห์
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
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
              <p className="mb-0 small text-muted">กรองการชำระเงินตามสถานะที่ต้องการ</p>
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
              <option value="pending">รอตรวจสอบ</option>
              <option value="verified">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </Form.Select>
          </Form.Group>
          <div className="d-flex gap-2 flex-wrap">
            {(["pending", "verified", "rejected", "all"] as const).map((f) => (
              <Button
                key={f}
                variant={
                  filter === f
                    ? f === "pending"
                      ? "warning"
                      : f === "verified"
                        ? "success"
                        : f === "rejected"
                          ? "danger"
                          : "dark"
                    : "outline-secondary"
                }
                size="sm"
                className="rounded-2"
                onClick={() => setFilter(f)}
              >
                <i
                  className={`bi bi-${
                    f === "pending"
                      ? "hourglass-split"
                      : f === "verified"
                      ? "check2-circle"
                      : f === "rejected"
                      ? "x-circle"
                      : "collection"
                  } me-1`}
                ></i>
                {filterLabels[f]}
                {f === "pending" &&
                  `(${payments.filter((p) => p.status === "pending").length})`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3 text-muted">กำลังโหลดข้อมูลการชำระเงิน...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-0">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-5">
                  <div className="rounded-circle p-4 bg-light mb-3 d-inline-block">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                  </div>
                  <h5 className="text-muted">
                    {filter === 'all'
                      ? 'ยังไม่มีข้อมูลการชำระเงิน'
                      : `ไม่พบรายการที่ ${filterLabels[filter]}`}
                  </h5>
                  <p className="text-muted mt-2">
                    ลองปรับเปลี่ยนเงื่อนไขการกรองหรือรอการอัปโหลดสลิปจากผู้เช่า
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>วันที่อัปโหลด</th>
                        <th>ห้อง</th>
                        <th>ผู้เช่า</th>
                        <th>บิล</th>
                        <th>ยอดบิล</th>
                        <th>ยอด OCR</th>
                        <th>สถานะ</th>
                        <th className="text-center min-w-250px">
                          การจัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p) => (
                        <tr key={p._id}>
                          <td>
                            {format(new Date(p.createdAt), "dd MMM yy, HH:mm", {
                              locale: th,
                            })}
                          </td>
                          <td>{p.billId.roomId.roomNumber}</td>
                          <td>{p.userId.name}</td>
                          <td>
                            {`เดือน ${p.billId.month}/${p.billId.year}`}
                            <div className="small text-muted">
                              {p.billId.totalAmount.toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              บาท
                            </div>
                          </td>
                          <td>{p.billId.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                          <td>
                            {p.ocrData?.amount ? `${p.ocrData.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท` : "N/A"}
                          </td>
                          <td>{getStatusBadge(p.status)}</td>
                          <td className="text-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="rounded-2"
                              onClick={() => handleShowModal(p)}
                            >
                              <i className="bi bi-search me-2"></i>ตรวจสอบ
                            </Button>
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
      {renderVerificationModal()}
    </div>
  );
};

export default AdminPaymentsPage;
