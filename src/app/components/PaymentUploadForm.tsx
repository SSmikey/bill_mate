import React, { useState, useMemo } from "react";
import SlipReader, { OCRData, QRData } from "./SlipReader"; // Import OCRData and QRData
import { parseBase64File, isValidImageType } from "@/lib/fileUtils";

interface PaymentUploadFormProps {
  billId: string;
  billAmount: number;
  onUploadSuccess: () => void;
  // Optional prop to allow parent to reset the form
  onReset?: () => void;
}

const PaymentUploadForm: React.FC<PaymentUploadFormProps> = ({
  billId,
  billAmount,
  onUploadSuccess,
}) => {
  const [slipImageBase64, setSlipImageBase64] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<OCRData | null>(null); // Use specific type
  const [qrData, setQrData] = useState<QRData | null>(null); // Use specific type
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleScanComplete = (data: {
    slipImageBase64: string | null;
    ocrData: OCRData | null;
    qrData: QRData | null;
  }) => {
    setSlipImageBase64(data.slipImageBase64);
    setOcrData(data.ocrData);
    setQrData(data.qrData);
  };

  const handleSubmit = async () => {
    setUploading(true);
    setUploadError(null);

    try {
      const validationResult = validatePayment();
      // Stop only on hard errors, not on warnings.
      if (validationResult && validationResult.type !== "warning") {
        setUploadError(validationResult.message);
        setUploading(false);
        return;
      }
      // Clear previous errors if validation passes or is just a warning
      setUploadError(null);

      const response = await fetch("/api/payments/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billId: billId,
          slipImageBase64: slipImageBase64,
          ocrData: ocrData,
          qrData: qrData,
        }),
      });

      if (response.ok) {
        console.log("Payment uploaded successfully");
        onUploadSuccess();
      } else {
        const errorData = await response.json();
        setUploadError(errorData.message || "เกิดข้อผิดพลาดในการอัปโหลด");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  const validatePayment = (): {
    message: string;
    type?: "warning" | "error";
  } | null => {
    if (!slipImageBase64) return { message: "กรุณาอัปโหลดรูปสลิป" };
    if (!ocrData && !qrData)
      return { message: "ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาลองใหม่หรือใช้รูปภาพที่ชัดเจนขึ้น" };

    // Validate file type
    const fileInfo = parseBase64File(slipImageBase64);
    if (fileInfo && !isValidImageType(fileInfo.contentType)) {
      return { message: "ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดรูปภาพเท่านั้น" };
    }

    // Try to get amount from OCR first, then from QR data
    let amountToCompare: number | null = null;
    let amountSource = "";
    
    if (ocrData?.amount) {
      amountToCompare = parseFloat(ocrData.amount);
      amountSource = "OCR";
    } else if (qrData?.amount) {
      amountToCompare = parseFloat(qrData.amount);
      amountSource = "QR Code";
    }

    if (amountToCompare !== null && Math.abs(amountToCompare - billAmount) > 100) {
      return {
        type: "warning", // Indicate this is a warning, not a hard error
        message: `จำนวนเงินที่อ่านได้จาก${amountSource} (${amountToCompare.toFixed(2)} บาท) ไม่ตรงกับบิล (${billAmount} บาท)`,
      };
    }

    // If only QR data is available and no OCR, show info message
    if (!ocrData && qrData) {
      return {
        type: "warning",
        message: "อ่านข้อมูลจาก QR Code สำเร็จ แต่ไม่สามารถอ่านข้อความจากสลิปได้ กรุณาตรวจสอบข้อมูลให้ถูกต้อง",
      };
    }

    return null;
  };

  // Memoize the validation result to avoid re-calculating on each render
  const validationResult = useMemo(
    () => validatePayment(),
    [slipImageBase64, ocrData, qrData, billAmount]
  );

  return (
    <div>
      <SlipReader onScanComplete={handleScanComplete} isEmbedded={true} />

        {(ocrData || qrData) && (
          <div className="mt-4">
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-info-circle text-primary me-2"></i>
              <h6 className="mb-0 fw-semibold">ข้อมูลที่ตรวจพบจากสลิป:</h6>
            </div>

            <div className="card bg-light border-0 rounded-3">
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="bi bi-currency-dollar text-primary"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">จำนวนเงิน</small>
                        <div className="fw-bold text-dark">
                          {ocrData?.amount || qrData?.amount || "N/A"} บาท
                          {!ocrData && qrData?.amount && (
                            <small className="text-muted d-block">(จาก QR Code)</small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="bi bi-calendar text-info"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">วันที่</small>
                        <div className="fw-semibold text-dark">{ocrData?.date || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                        <i className="bi bi-clock text-warning"></i>
                      </div>
                      <div>
                        <small className="text-muted d-block">เวลา</small>
                        <div className="fw-semibold text-dark">{ocrData?.time || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  {qrData?.reference && (
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-secondary bg-opacity-10 rounded-circle p-3 me-3">
                          <i className="bi bi-upc-scan text-secondary"></i>
                        </div>
                        <div>
                          <small className="text-muted d-block">เลขอ้างอิง (QR)</small>
                          <div className="fw-semibold font-monospace small text-dark">{qrData.reference}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-top">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <small className="text-muted">การตรวจสอบกับบิล:</small>
                      <div className="mt-1">
                        {(ocrData?.amount || qrData?.amount) ? (
                          parseFloat(ocrData?.amount || qrData?.amount || "0") === billAmount ? (
                            <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">
                              <i className="bi bi-check-circle me-1"></i>
                              ตรงกับบิล
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning rounded-pill px-3 py-2">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              ไม่ตรงกับบิล
                            </span>
                          )
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill px-3 py-2">
                            <i className="bi bi-dash-circle me-1"></i>
                            ไม่สามารถตรวจสอบได้
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Display warning if amount doesn't match but we allow submission */}
            {validationResult?.type === "warning" && (
              <div className="alert alert-warning alert-dismissible fade show d-flex align-items-start mt-3 rounded-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 mt-1"></i>
                <div className="flex-grow-1">{validationResult.message}</div>
              </div>
            )}

            {uploadError && (
              <div className="alert alert-danger alert-dismissible fade show d-flex align-items-start mt-3 rounded-3" role="alert">
                <i className="bi bi-x-circle-fill me-2 mt-1"></i>
                <div className="flex-grow-1">{uploadError}</div>
              </div>
            )}

            <div className="d-flex gap-2 mt-4">
              <button
                className="btn btn-primary shadow-sm flex-grow-1 rounded-3 py-2"
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    ยืนยันการชำระเงิน
                  </>
                )}
              </button>
              <button
                className="btn btn-outline-secondary rounded-3 py-2 px-4"
                onClick={() => {
                  setSlipImageBase64(null);
                  setOcrData(null);
                  setQrData(null);
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                ลองใหม่
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default PaymentUploadForm;
