import React, { useState, useMemo } from "react";
import SlipReader, { OCRData, QRData } from "./SlipReader"; // Import OCRData and QRData
import { parseBase64File, isValidImageType } from "@/lib/fileStorage";

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
      return { message: "ไม่สามารถอ่านข้อมูลจากสลิปได้" };

    // Validate file type
    const fileInfo = parseBase64File(slipImageBase64);
    if (fileInfo && !isValidImageType(fileInfo.contentType)) {
      return { message: "ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดรูปภาพเท่านั้น" };
    }

    // Convert ocrData.amount to number for comparison
    const ocrAmount = ocrData?.amount ? parseFloat(ocrData.amount) : null;
    if (ocrAmount !== null && Math.abs(ocrAmount - billAmount) > 100) {
      return {
        type: "warning", // Indicate this is a warning, not a hard error
        message: `จำนวนเงินที่อ่านได้ (${ocrData?.amount ?? 'N/A'} บาท) ไม่ตรงกับบิล (${billAmount} บาท)`,
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
    <div className="card">
      <div className="card-header">
        <h5>อัปโหลดสลิปการชำระเงิน</h5>
      </div>
      <div className="card-body">
        <SlipReader onScanComplete={handleScanComplete} isEmbedded={true} />{" "}
        {/* Pass isEmbedded prop */}
        {(ocrData || qrData) && (
          <div className="mt-3">
            <h6>ข้อมูลที่ตรวจพบจากสลิป:</h6>
            <table className="table table-sm">
              <tbody>
                <tr>
                  <td>จำนวนเงิน:</td>
                  <td>{ocrData?.amount || "N/A"} บาท</td>
                  <td className="text-end">
                    {ocrData?.amount ? (
                      parseFloat(ocrData.amount) === billAmount ? (
                        <span className="badge bg-success">ตรงกับบิล</span>
                      ) : (
                        <span className="badge bg-warning">ไม่ตรงกับบิล</span>
                      )
                    ) : null}
                  </td>
                </tr>
                <tr>
                  <td>วันที่:</td>
                  <td>{ocrData?.date || "N/A"}</td>
                </tr>
                <tr>
                  <td>เวลา:</td>
                  <td>{ocrData?.time || "N/A"}</td>
                </tr>
              </tbody>
            </table>
            {/* Display warning if amount doesn't match but we allow submission */}
            {validationResult?.type === "warning" && (
              <div className="alert alert-warning" role="alert">
                {validationResult.message}
              </div>
            )}

            {uploadError && (
              <div className="alert alert-danger" role="alert">
                {uploadError}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? "กำลังอัปโหลด..." : "ยืนยันการชำระเงิน"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentUploadForm;
