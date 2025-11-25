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

  // State for rejection confirmation dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // State for success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    // Deep copy for editing, handle undefined case
    setEditableOcrData(payment.ocrData ? JSON.parse(JSON.stringify(payment.ocrData)) : {});
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
      setSuccessMessage("อนุมัติการชำระเงินเรียบร้อยแล้ว");
      await fetchPayments();
      handleCloseModal();
      // Auto hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = () => {
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      const response = await fetch(
        `/api/payments/${selectedPayment._id}/verify`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: false, rejectionReason: rejectReason }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "การปฏิเสธล้มเหลว");
      }
      setSuccessMessage("ปฏิเสธการชำระเงินเรียบร้อยแล้ว");
      await fetchPayments();
      handleCloseModal();
      setShowRejectDialog(false);
      setRejectReason('');
      // Auto hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const cancelReject = () => {
    setShowRejectDialog(false);
    setRejectReason('');
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
          <Modal.Title className="fw-bold text-dark">
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
                {selectedPayment.slipImageUrl ? (
                  <div className="position-relative">
                    <img
                      src={selectedPayment.slipImageUrl}
                      className="img-fluid rounded"
                      alt="Payment slip"
                      style={{
                        maxHeight: "500px",
                        width: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        console.error('Image load error - URL:', selectedPayment.slipImageUrl);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'text-center py-5';
                          errorDiv.innerHTML = `
                            <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                            <p class="text-muted mt-2">ไม่สามารถโหลดรูปภาพสลิปได้</p>
                            <small class="text-muted d-block mb-3">URL: ${selectedPayment.slipImageUrl}</small>
                          `;
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-image fs-1 text-muted"></i>
                    <p className="text-muted mt-2">ไม่พบรูปภาพสลิป</p>
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle p-2 me-2 bg-info bg-opacity-10">
                  <i className="bi bi-file-earmark-text fs-5 text-info"></i>
                </div>
                <h6 className="mb-0 fw-semibold text-dark">ข้อมูลบิล</h6>
              </div>
              <div className="card border-0 bg-light rounded-3 mb-3">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-muted d-block">ห้อง</small>
                      <span className="fw-semibold text-dark">{selectedPayment.billId?.roomId?.roomNumber || 'N/A'}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">ผู้เช่า</small>
                      <span className="fw-semibold text-dark">{selectedPayment.userId?.name || 'N/A'}</span>
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
                  <h6 className="mb-0 fw-semibold text-dark">ข้อมูลจาก OCR</h6>
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
                        <div className="d-flex align-items-center text-dark">
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
                    <div className="col-12 text-dark">
                      <small className="text-muted d-block">วันที่-เวลา</small>
                      {isEditingOcr ? (
                        <div className="d-flex gap-2">
                          <input type="text" name="date" className="form-control form-control-sm rounded-2 text-dark" value={editableOcrData?.date || ''} onChange={handleOcrInputChange} placeholder="DD/MM/YYYY" />
                          <input type="text" name="time" className="form-control form-control-sm rounded-2 text-dark" value={editableOcrData?.time || ''} onChange={handleOcrInputChange} placeholder="HH:MM" />
                        </div>
                      ) : (
                        <span className="fw-semibold text-dark">
                          {selectedPayment.ocrData.date || "N/A"} - {selectedPayment.ocrData.time || "N/A"}
                        </span>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">จากบัญชี</small>
                      {isEditingOcr ? (
                        <input type="text" name="fromAccount" className="form-control form-control-sm rounded-2 text-dark" value={editableOcrData?.fromAccount || ''} onChange={handleOcrInputChange} />
                      ) : (
                        <span className="fw-semibold text-dark">{selectedPayment.ocrData.fromAccount || "N/A"}</span>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">ไปบัญชี</small>
                      {isEditingOcr ? (
                        <input type="text" name="toAccount" className="form-control form-control-sm rounded-2 text-dark" value={editableOcrData?.toAccount || ''} onChange={handleOcrInputChange} />
                      ) : (
                        <span className="fw-semibold text-dark">{selectedPayment.ocrData.toAccount || "N/A"}</span>
                      )}
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">เลขที่อ้างอิง</small>
                      {isEditingOcr ? (
                        <input type="text" name="reference" className="form-control form-control-sm rounded-2 text-dark" value={editableOcrData?.reference || ''} onChange={handleOcrInputChange} />
                      ) : (
                        <span className="fw-semibold text-dark">{selectedPayment.ocrData.reference || "N/A"}</span>
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
                    <h6 className="mb-0 fw-semibold text-dark">ข้อมูลจาก QR Code</h6>
                  </div>
                  <div className="card border-0 bg-light rounded-3">
                    <div className="card-body">
                      <div className="row g-3">
                        <div className="col-12">
                          <small className="text-muted d-block">จำนวนเงิน</small>
                          <span className="fw-bold text-dark">
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

      {/* Success Alert */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <div className="d-flex align-items-center">
            <div className="rounded-circle p-3 me-3 bg-success bg-opacity-20">
              <i className="bi bi-check-circle-fill fs-5 text-success"></i>
            </div>
            <div>
              <h5 className="mb-0 text-dark fw-semibold">{successMessage}</h5>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage(null)}
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
                          <td>{p.billId?.roomId?.roomNumber || 'N/A'}</td>
                          <td>{p.userId?.name || 'N/A'}</td>
                          <td>
                            {p.billId ? `เดือน ${p.billId.month}/${p.billId.year}` : 'N/A'}
                            {p.billId && (
                              <div className="small text-muted">
                                {p.billId.totalAmount.toLocaleString("th-TH", {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                บาท
                              </div>
                            )}
                          </td>
                          <td>{p.billId?.totalAmount?.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'} บาท</td>
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

      {/* Rejection Confirmation Dialog */}
      <Modal show={showRejectDialog} onHide={cancelReject} centered size="lg">
        <Modal.Header closeButton className="bg-danger text-white border-0">
          <Modal.Title className="fw-semibold">
            <i className="bi bi-x-circle-fill me-2"></i>
            ยืนยันการปฏิเสธบิล
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
                {/* Warning Card */}
                <div className="card border-0 bg-warning bg-opacity-10 rounded-3 mb-3">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle p-3 me-3 bg-warning bg-opacity-20">
                        <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold mb-2 text-dark">คำเตือน</h6>
                        <p className="mb-0 text-muted">
                          การดำเนินการนี้จะปฏิเสธบิลชำระเงินและส่งแจ้งไปยังผู้เช่า
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill Information Card */}
                <div className="card border-0 bg-info bg-opacity-10 rounded-3 mb-3">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle p-3 me-3 bg-info bg-opacity-20">
                        <i className="bi bi-receipt fs-4 text-info"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold mb-2 text-dark">ข้อมูลบิล</h6>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-house-door me-2 text-muted"></i>
                              <span className="fw-semibold">ห้อง:</span>
                            </div>
                            <span className="fw-bold text-dark">{selectedPayment?.billId?.roomId?.roomNumber || 'N/A'}</span>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-person me-2 text-muted"></i>
                              <span className="fw-semibold">ผู้เช่า:</span>
                            </div>
                            <span className="fw-bold text-dark">{selectedPayment?.userId?.name || 'N/A'}</span>
                          </div>
                          <div className="col-12 mt-2">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-calendar-event me-2 text-muted"></i>
                              <span className="fw-semibold">เดือน/ปี:</span>
                            </div>
                            <span className="fw-bold text-dark">{' '}
                              {selectedPayment?.billId ? `${selectedPayment.billId.month}/${selectedPayment.billId.year}` : 'N/A'}
                            </span>
                          </div>
                          <div className="col-12 mt-2">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-cash-stack me-2 text-muted"></i>
                              <span className="fw-semibold">จำนวนเงิน:</span>
                            </div>
                            <span className="fw-bold text-dark fs-5">{' '}
                              {selectedPayment?.billId?.totalAmount?.toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              บาท
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rejection Reason Card */}
                <div className="card border-0 bg-light rounded-3 mb-3">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle p-3 me-3 bg-danger bg-opacity-20">
                        <i className="bi bi-chat-left-text fs-4 text-danger"></i>
                      </div>
                      <div>
                        <h6 className="fw-semibold mb-2 text-dark">เหตุผลการปฏิเสธ</h6>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="rejectReason" className="form-label fw-semibold text-dark">
                        <i className="bi bi-pencil-square me-2"></i>
                        เหตุผลในการปฏิเสธ <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="rejectReason"
                        className="form-control rounded-2 border-2 bg-white text-dark"
                        rows={4}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="ระบุเหตุผลที่ชัดเจน..."
                        required
                        style={{ minHeight: '100px' }}
                      />
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        กรุณาระบุเหตุผลอย่างชัดเจนเพื่อประกอนผู้เช่า
                      </small>
                    </div>
                  </div>
                </div>

                {/* Confirmation Warning */}
                <div className="alert alert-danger border-0 rounded-3">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-3 me-3">
                      <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-2">ต้องการยืนยันการปฏิเสธบิลนี้ใช่หรือไม่?</h6>
                      <p className="mb-0 text-muted">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                    </div>
                  </div>
                </div>
        </Modal.Body>
        <Modal.Footer className="border-0 bg-light rounded-bottom-3">
          <Button
            variant="outline-secondary"
            className="rounded-2 px-4"
            onClick={cancelReject}
            disabled={isRejecting}
          >
            <i className="bi bi-x-lg me-2"></i>
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            className="rounded-2 px-4"
            onClick={confirmReject}
            disabled={isRejecting || !rejectReason.trim()}
          >
            {isRejecting ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <i className="bi bi-x-circle-fill me-2"></i>
                ยืนยันการปฏิเสธ
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminPaymentsPage;
