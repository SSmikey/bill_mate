"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Spinner, Alert, Badge, Table } from "react-bootstrap";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { rejects } from "assert";

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
    setEditableOcrData({
      ...editableOcrData,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSaveOcr = async () => {
    if (!selectedPayment || !editableOcrData) return;
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/payments/${selectedPayment._id}/ocr`, {
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

  const renderFilters = () => {
    const filters: (PaymentStatus | "all")[] = [
      "pending",
      "verified",
      "rejected",
      "all",
    ];
    // ย้าย filterLabels ออกไปข้างนอกแล้ว
    // const filterLabels: { [key: string]: string } = {
    //   pending: "รอตรวจสอบ",
    //   verified: "อนุมัติแล้ว",
    //   rejected: "ปฏิเสธ",
    //   all: "ทั้งหมด",
    // };
    const filterColors: { [key: string]: string } = {
      pending: "warning",
      verified: "success",
      rejected: "danger",
      all: "dark",
    };

    return (
      <div className="mb-3">
        {filters.map((f) => (
          <Button
            key={f}
            // ถ้าปุ่มถูกเลือก ให้ใช้สีจาก map, ถ้าไม่มีให้ใช้สีน้ำเงิน(primary) เหมือนเดิม
            variant={
              filter === f ? filterColors[f] || "primary" : "outline-secondary"
            }
            size="sm"
            className="me-2"
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
    );
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
    const isAmountMatch =
      ocrAmount !== undefined && Math.abs(ocrAmount - billAmount) < 0.01;

    return (
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-receipt-cutoff me-2"></i>ตรวจสอบการชำระเงิน
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isVerifying && (
            <div className="text-center mb-3">
              <Spinner animation="border" variant="primary" />
              <p>กำลังดำเนินการ...</p>
            </div>
          )}
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <h6>
                <i className="bi bi-image me-2"></i>สลิปการชำระ
              </h6>
              <img
                src={selectedPayment.slipImageUrl}
                className="img-fluid border rounded shadow-sm"
                alt="Payment slip"
                style={{
                  maxHeight: "600px",
                  width: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
            <div className="col-md-6">
              <h6>
                <i className="bi bi-file-earmark-text me-2"></i>ข้อมูลบิล
              </h6>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <td>ห้อง</td>
                    <td>{selectedPayment.billId.roomId.roomNumber}</td>
                  </tr>
                  <tr>
                    <td>ผู้เช่า</td>
                    <td>{selectedPayment.userId.name}</td>
                  </tr>
                  <tr>
                    <td>ยอดบิล</td>
                    <td>
                      <strong>
                        {billAmount.toLocaleString("th-TH", {
                          style: "currency",
                          currency: "THB",
                        })}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </Table>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <h6>
                  <i className="bi bi-search me-2"></i>ข้อมูลจาก OCR
                </h6>
                {!isEditingOcr && selectedPayment.status === 'pending' && (
                  <Button variant="outline-primary" size="sm" onClick={() => setIsEditingOcr(true)}>
                    <i className="bi bi-pencil-square me-1"></i> แก้ไข
                  </Button>
                )}
              </div>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <td>จำนวนเงิน</td>
                    <td>
                      {isEditingOcr ? (
                        <input
                          type="number"
                          name="amount"
                          className="form-control form-control-sm"
                          value={editableOcrData?.amount || ''}
                          onChange={handleOcrInputChange}
                        />
                      ) : (
                        <>
                          <strong>
                            {ocrAmount
                              ? ocrAmount.toLocaleString("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                })
                              : "N/A"}
                          </strong>
                          {ocrAmount !== undefined &&
                            (isAmountMatch ? (
                              <Badge bg="success" className="ms-2">
                                ตรงกัน
                              </Badge>
                            ) : (
                              <Badge bg="danger" className="ms-2">
                                ไม่ตรงกัน
                              </Badge>
                            ))}
                        </>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>วันที่-เวลา</td>
                    <td>
                      {isEditingOcr ? (
                        <div className="d-flex">
                          <input type="text" name="date" className="form-control form-control-sm me-1" value={editableOcrData?.date || ''} onChange={handleOcrInputChange} placeholder="DD/MM/YYYY" />
                          <input type="text" name="time" className="form-control form-control-sm" value={editableOcrData?.time || ''} onChange={handleOcrInputChange} placeholder="HH:MM" />
                        </div>
                      ) : (
                        `${selectedPayment.ocrData.date || "N/A"} - ${selectedPayment.ocrData.time || "N/A"}`
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>จากบัญชี</td>
                    <td>
                      {isEditingOcr ? (
                        <input type="text" name="fromAccount" className="form-control form-control-sm" value={editableOcrData?.fromAccount || ''} onChange={handleOcrInputChange} />
                      ) : (
                        selectedPayment.ocrData.fromAccount || "N/A"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>ไปบัญชี</td>
                    <td>
                      {isEditingOcr ? (
                        <input type="text" name="toAccount" className="form-control form-control-sm" value={editableOcrData?.toAccount || ''} onChange={handleOcrInputChange} />
                      ) : (
                        selectedPayment.ocrData.toAccount || "N/A"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>เลขที่อ้างอิง</td>
                    <td>
                      {isEditingOcr ? (
                        <input type="text" name="reference" className="form-control form-control-sm" value={editableOcrData?.reference || ''} onChange={handleOcrInputChange} />
                      ) : (
                        selectedPayment.ocrData.reference || "N/A"
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
              {isEditingOcr && (
                <div className="text-end"><Button variant="link" size="sm" onClick={() => setIsEditingOcr(false)}>ยกเลิก</Button><Button variant="primary" size="sm" onClick={handleSaveOcr} disabled={isVerifying}>{isVerifying ? 'กำลังบันทึก...' : 'บันทึก'}</Button></div>
              )}

              {selectedPayment.qrData && (
                <>
                  <h6 className="mt-3">
                    <i className="bi bi-qr-code me-2"></i>ข้อมูลจาก QR Code
                  </h6>
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <td>จำนวนเงิน</td>
                        <td>
                          {selectedPayment.qrData.amount
                            ? selectedPayment.qrData.amount.toLocaleString(
                                "th-TH",
                                {
                                  style: "currency",
                                  currency: "THB",
                                }
                              )
                            : "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          {!isEditingOcr && (
            <>
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isVerifying}
              >
                ปิด
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={isVerifying || selectedPayment.status !== 'pending'}
              >
                <i className="bi bi-x-lg me-1"></i>ปฏิเสธ
              </Button>
              <Button
                variant="success"
                onClick={handleApprove}
                disabled={isVerifying || selectedPayment.status !== 'pending'}
              >
                <i className="bi bi-check-lg me-1"></i>อนุมัติ
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header bg-light">
          <h3>
            <i className="bi bi-check2-circle me-2"></i>ยืนยันการชำระเงิน
          </h3>
          <p className="text-muted">
            ตรวจสอบและยืนยันสลิปการชำระเงินที่ผู้เช่าอัปโหลด
          </p>
        </div>
        <div className="card-body">
          {renderFilters()}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">กำลังโหลดข้อมูล...</p>
            </div>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && (
            <div className="table-responsive">
              <Table hover striped>
                <thead className="table-light">
                  <tr>
                    <th>วันที่อัปโหลด</th>
                    <th>ห้อง</th>
                    <th>ผู้เช่า</th>
                    <th>บิล</th>
                    <th>ยอดบิล</th>
                    <th>ยอด OCR</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((p) => (
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
                        {/* No change here, but showing for context */}
                        <td>{p.billId.totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</td>
                        {/* No change here, but showing for context */}
                        <td>
                          {p.ocrData?.amount ? `${p.ocrData.amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท` : "N/A"}
                        </td>
                        <td>{getStatusBadge(p.status)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowModal(p)}
                          >
                            <i className="bi bi-search me-2"></i>ตรวจสอบ
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        {filter === 'all'
                          ? 'ยังไม่มีข้อมูลการชำระเงิน'
                          : `ไม่พบรายการที่ ${filterLabels[filter]}`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {renderVerificationModal()}
    </div>
  );
};

export default AdminPaymentsPage;
