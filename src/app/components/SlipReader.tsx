"use client";

import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import * as Tesseract from "tesseract.js";

 export interface QRData {
  merchantID: string;
  amount: string;
  reference: string;
  billPaymentRef1: string;
  billPaymentRef2: string;
}

export interface OCRData {
  amount: string | null;
  fee: string | null;
  date: string | null;
  time: string | null;
  reference: string | null;
  ref1: string | null;
  ref2: string | null;
  transactionNo: string | null;
  fromAccount: string | null;
  toAccount: string | null;
  transferType: string | null;
}

interface SlipData {
  slip_data: {
    ocr_data: OCRData | null;
    qr_data: QRData | null;
  };
  timestamp: string;
  success: boolean;
}

interface SlipReaderProps {
  onScanComplete?: (data: {
    slipImageBase64: string | null;
    ocrData: OCRData | null;
    qrData: QRData | null;
  }) => void;
  isEmbedded?: boolean; // New prop to control rendering when embedded
}

export default function SlipReader({
  onScanComplete,
  isEmbedded = false,
}: SlipReaderProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ message: "", percent: 0 });
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [ocrTextFull, setOcrTextFull] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showOcrText, setShowOcrText] = useState(false);
  const [jsonOutput, setJsonOutput] = useState<SlipData | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [tesseractLoaded, setTesseractLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setError(null);
      setQrData(null);
      setOcrData(null);
      setOcrTextFull("");
      setJsonOutput(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  useEffect(() => {
    if (previewImage && imageRef.current) {
      processImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewImage]);

  useEffect(() => {
    if (jsonOutput && onScanComplete) {
      onScanComplete({
        slipImageBase64: previewImage,
        ocrData: jsonOutput.slip_data.ocr_data,
        qrData: jsonOutput.slip_data.qr_data,
      });
      // Optionally reset internal state if it's a one-shot embedded use
      if (isEmbedded) resetUpload();
    }
  }, [jsonOutput, onScanComplete, previewImage, isEmbedded]);

  useEffect(() => {
    // Check if Tesseract is available
    try {
      if (Tesseract && typeof Tesseract.recognize === 'function') {
        setTesseractLoaded(true);
        console.log("Tesseract loaded successfully");
      } else {
        console.warn("Tesseract recognize function not available");
        setTesseractLoaded(false);
      }
    } catch (err) {
      console.error("Error checking Tesseract:", err);
      setTesseractLoaded(false);
    }
  }, []);

  const processImage = async () => {
    setLoading(true);
    setProgress({ message: "กำลังประมวลผล...", percent: 0 });
    setError(null); // Clear any previous errors

    try {
      // Step 1: Read QR Code
      setProgress({ message: "กำลังอ่าน QR Code...", percent: 25 });
      const qr = await scanQRCode();
      setQrData(qr);

      // Step 2: OCR (with fallback handling)
      if (tesseractLoaded) {
        setProgress({ message: "กำลังอ่านข้อความจากสลิป...", percent: 50 });
      } else {
        setProgress({ message: "OCR ไม่พร้อมใช้งาน ข้ามไปใช้ QR Code...", percent: 50 });
      }
      
      let ocr: OCRData | null = null;
      let ocrError: Error | null = null;
      
      try {
        ocr = await performOCR();
        setOcrData(ocr);
      } catch (err) {
        ocrError = err as Error;
        console.warn("OCR failed, but continuing with QR data if available:", err);
        // Don't set error state here, we'll handle it below
      }

      // Step 3: Create JSON output
      setProgress({ message: "กำลังประมวลผลข้อมูล...", percent: 90 });
      await new Promise((resolve) => setTimeout(resolve, 500));

      const output: SlipData = {
        slip_data: {
          ocr_data: ocr,
          qr_data: qr,
        },
        timestamp: new Date().toISOString(),
        success: !!(qr || ocr),
      };
      setJsonOutput(output);

      // Set appropriate message based on results
      if (qr && !ocr) {
        setProgress({ message: "อ่าน QR Code สำเร็จ (OCR ล้มเหลว)", percent: 100 });
      } else if (!qr && !ocr) {
        setProgress({ message: "ไม่สามารถอ่านข้อมูลได้", percent: 100 });
      } else {
        setProgress({ message: "เสร็จสิ้น!", percent: 100 });
      }
      
      setTimeout(() => setLoading(false), 1000);
      
      // If both failed, show error
      if (!qr && !ocr && ocrError) {
        setError("ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณาลองใหม่หรือใช้รูปภาพที่ชัดเจนขึ้น");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Process Image Error:", err);
      setError("เกิดข้อผิดพลาดในการประมวลผล: " + errorMessage);
      setLoading(false);
    }
  };

  const scanQRCode = (): Promise<QRData | null> => {
    return new Promise((resolve) => {
      if (!canvasRef.current || !imageRef.current) {
        resolve(null);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = imageRef.current;

      if (!ctx) {
        resolve(null);
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        resolve(parsePromptPayData(code.data));
      } else {
        resolve(null);
      }
    });
  };

  const performOCR = async (): Promise<OCRData | null> => {
    try {
      if (!previewImage) {
        console.warn("No preview image available for OCR");
        return null;
      }

      // Check if Tesseract is loaded and available
      if (!tesseractLoaded) {
        console.warn("Tesseract not loaded, skipping OCR");
        return null;
      }

      console.log("Starting OCR processing...");
      
      // Add timeout and retry logic for OCR
      const OCR_TIMEOUT = 60000; // 60 seconds timeout
      
      const result = await Promise.race([
        (async () => {
          try {
            const ocrResult = await Tesseract.recognize(previewImage, "tha+eng", {
              logger: (m: any) => {
                console.log("OCR Progress:", m);
                if (m.status === "recognizing text") {
                  const progressPercent = Math.round(m.progress * 100);
                  setProgress({
                    message: `กำลังอ่านข้อความ... ${progressPercent}%`,
                    percent: 50 + progressPercent * 0.4,
                  });
                } else if (m.status === "loading language traineddata") {
                  setProgress({
                    message: `กำลังโหลดข้อมูลภาษา...`,
                    percent: 45,
                  });
                } else if (m.status === "initializing tesseract") {
                  setProgress({
                    message: `กำลังเริ่มต้นระบบ OCR...`,
                    percent: 30,
                  });
                }
              },
            });
            console.log("OCR completed successfully:", ocrResult);
            return ocrResult;
          } catch (innerErr) {
            console.error("Inner OCR error:", innerErr);
            throw innerErr;
          }
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("OCR timeout - กรุณาลองใหม่")), OCR_TIMEOUT)
        )
      ]) as any;

      if (!result || !result.data) {
        console.error("Invalid OCR result:", result);
        throw new Error("OCR failed to process image - no data returned");
      }

      console.log("OCR text extracted:", result.data.text);
      setOcrTextFull(result.data.text);
      return extractSlipInfo(result.data.text);
    } catch (err) {
      // Enhanced error logging
      console.error("OCR Error Details:", {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : 'No stack trace',
        errorType: typeof err,
        hasPreviewImage: !!previewImage,
        tesseractLoaded
      });
      
      // Don't set error state here, let the parent handle it
      // Just log and return null so the process can continue with QR data
      return null;
    }
  };

  const parsePromptPayData = (data: string): QRData | null => {
    try {
      const info: QRData = {
        merchantID: "",
        amount: "",
        reference: "",
        billPaymentRef1: "",
        billPaymentRef2: "",
      };

      let i = 0;
      while (i < data.length) {
        const tag = data.substring(i, i + 2);
        i += 2;

        const length = parseInt(data.substring(i, i + 2));
        i += 2;

        const value = data.substring(i, i + length);
        i += length;

        if (tag === "29" && value.length > 0) {
          let j = 0;
          while (j < value.length) {
            const subTag = value.substring(j, j + 2);
            j += 2;
            const subLength = parseInt(value.substring(j, j + 2));
            j += 2;
            const subValue = value.substring(j, j + subLength);
            j += subLength;

            if (subTag === "01") {
              info.merchantID = formatPromptPayID(subValue);
            }
          }
        }

        if (tag === "54") {
          info.amount = value;
        }

        if (tag === "62" && value.length > 0) {
          let j = 0;
          while (j < value.length) {
            const subTag = value.substring(j, j + 2);
            j += 2;
            const subLength = parseInt(value.substring(j, j + 2));
            j += 2;
            const subValue = value.substring(j, j + subLength);
            j += subLength;

            if (subTag === "05") {
              info.reference = subValue;
            }
            if (subTag === "01") {
              info.billPaymentRef1 = subValue;
            }
            if (subTag === "02") {
              info.billPaymentRef2 = subValue;
            }
          }
        }
      }

      return info;
    } catch {
      return null;
    }
  };

  const formatPromptPayID = (id: string): string => {
    if (id.length === 15 && id.startsWith("00")) {
      const citizenID = id.substring(2);
      return citizenID.replace(
        /(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/,
        "$1-$2-$3-$4-$5"
      );
    }
    if (id.length === 13 && id.startsWith("66")) {
      const phoneNumber = "0" + id.substring(2);
      return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    if (id.length === 15 && id.startsWith("01")) {
      return id.substring(2);
    }
    return id;
  };

  const extractSlipInfo = (text: string): OCRData => {
    const info: OCRData = {
      amount: null,
      fee: null,
      date: null,
      time: null,
      reference: null,
      ref1: null,
      ref2: null,
      transactionNo: null,
      fromAccount: null,
      toAccount: null,
      transferType: null,
    };

    const cleanText = text
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\.\,\:\-\/\(\)\฿\.\,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Amount patterns
    const amountPatterns = [
      /(?:จำนวนเงิน|จ่าย|ยอดเงิน|โอน)[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /(?:Amount|Total|Pay)[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /THB[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /฿[:\s]*([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/,
      /([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})\s*(?:บาท|Baht)/i,
      /\b([1-9][0-9]{0,2}(?:,?[0-9]{3})*\.[0-9]{2})\b/,
      /(?:จำนวน|ยอด)[:\s]*([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})\s*บาท/i,
    ];

    for (const pattern of amountPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const amount = match[1].replace(/,/g, "");
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount >= 0.01 && numAmount <= 10000000) {
          info.amount = amount;
          break;
        }
      }
    }

    // Fee patterns
    const feePatterns = [
      /(?:ค่าธรรมเนียม|ค่าบริการ)[:\s]+([0-9]+(?:\.[0-9]{2})?)/i,
      /(?:Fee|Service\s*Charge)[:\s]+([0-9]+(?:\.[0-9]{2})?)/i,
    ];

    for (const pattern of feePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const fee = match[1].replace(/,/g, "");
        const numFee = parseFloat(fee);
        if (!isNaN(numFee) && numFee >= 0 && numFee <= 1000) {
          info.fee = fee;
          break;
        }
      }
    }

    // Date patterns
    const datePatterns = [
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.date = match[1];
        break;
      }
    }

    // Time patterns
    const timePatterns = [
      /(\d{1,2}:\d{2}:\d{2}(?:\s*(?:AM|PM|น\.|am|pm))?)/i,
      /(\d{1,2}:\d{2}(?:\s*(?:AM|PM|น\.|am|pm))?)/i,
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.time = match[1];
        break;
      }
    }

    // Reference patterns
    const refPatterns = [
      /(?:เลขที่อ้างอิง|หมายเลขอ้างอิง|อ้างอิง|Reference|Ref\s*No\.?|Ref\.?)[:\s]*([A-Z0-9]{10,})/i,
      /(?:Transaction\s*(?:ID|No|Number))[:\s]*([A-Z0-9]{10,})/i,
      /\b([A-Z]{3,6}[0-9]{8,})\b/,
    ];

    for (const pattern of refPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length >= 10 && match[1].length <= 50) {
        info.reference = match[1].trim();
        break;
      }
    }

    // Account pattern
    const accountPattern = /\b(\d{3}-?\d{1}-?\d{5}-?\d{1})\b/g;
    const accounts = text.match(accountPattern);
    if (accounts && accounts.length >= 1) {
      info.fromAccount = accounts[0];
      if (accounts.length >= 2) {
        info.toAccount = accounts[1];
      }
    }

    // Transfer type
    const lowerText = text.toLowerCase();
    if (lowerText.includes("promptpay") || text.includes("พร้อมเพย์")) {
      info.transferType = "PromptPay";
    } else if (text.includes("โอน") || lowerText.includes("transfer")) {
      info.transferType = "โอนเงิน";
    }

    return info;
  };

  const formatDateTime = (
    dateStr: string | null,
    timeStr: string | null
  ): string | null => {
    if (!dateStr) return null;

    const monthsEN: { [key: string]: string } = {
      jan: "01",
      january: "01",
      feb: "02",
      february: "02",
      mar: "03",
      march: "03",
      apr: "04",
      april: "04",
      may: "05",
      jun: "06",
      june: "06",
      jul: "07",
      july: "07",
      aug: "08",
      august: "08",
      sep: "09",
      sept: "09",
      september: "09",
      oct: "10",
      october: "10",
      nov: "11",
      november: "11",
      dec: "12",
      december: "12",
    };

    let day, month, year;

    let match = dateStr.match(
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})/i
    );
    if (match) {
      day = match[1].padStart(2, "0");
      month = monthsEN[match[2].toLowerCase()];
      year = match[3];
    }

    if (!month) {
      match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (match) {
        day = match[1].padStart(2, "0");
        month = match[2].padStart(2, "0");
        year = match[3].length === 2 ? "20" + match[3] : match[3];
      }
    }

    if (!month) return dateStr + (timeStr ? " " + timeStr : "");

    let formattedTime = "00:00:00";
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, "0");
        const minutes = timeMatch[2];
        const seconds = timeMatch[3] || "00";
        formattedTime = `${hours}:${minutes}:${seconds}`;
      }
    }

    return `${month}/${day}/${year} ${formattedTime}`;
  };

  const copyJsonToClipboard = () => {
    if (!jsonOutput) return;

    const jsonString = JSON.stringify(jsonOutput, null, 2);
    navigator.clipboard
      .writeText(jsonString)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        alert("ไม่สามารถคัดลอกได้");
      });
  };

  const resetUpload = () => {
    setPreviewImage(null);
    setQrData(null);
    setOcrData(null);
    setOcrTextFull("");
    setError(null);
    setJsonOutput(null);
    if (fileInputRef.current) {
      // Clear the file input value to allow re-uploading the same file
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 bg-primary">
      {isEmbedded && (
        <div className="w-100">
          {!previewImage && (
            <div
              className={`border border-3 border-dashed rounded-3 p-4 text-center ${
                dragging ? "border-primary bg-light" : "border-primary bg-light"
              }`}
              style={{
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="fs-1 mb-2">
                📄
              </div>
              <div className="text-primary fw-semibold fs-6 mb-1">
                คลิกเพื่ออัปโหลดสลิป หรือลากไฟล์มาวางที่นี่
              </div>
              <div className="text-muted small">
                รองรับไฟล์ JPG, PNG
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </div>
      )}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-lg rounded-4">
              <div className="card-body p-4 p-md-5">
                <h1 className="text-center mb-2">🏦 ตัวอ่านสลิปธนาคาร</h1>
                <p className="text-center text-muted mb-4">
                  อัปโหลดสลิปเพื่ออ่านข้อมูลด้วย QR Code และ OCR
                </p>

                {previewImage && (
                  <div className="mt-4">
                    <div className="text-center mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        src={previewImage}
                        alt="Preview"
                        className="img-fluid rounded-3 shadow"
                        style={{ maxHeight: "400px" }}
                      />
                    </div>
                    <canvas ref={canvasRef} className="d-none"></canvas>

                    {loading && (
                      <div className="card mb-4">
                        <div className="card-body">
                          <h6 className="text-primary fw-semibold text-center mb-3">
                            {progress.message}
                          </h6>
                          <div className="progress" style={{ height: "8px" }}>
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: `${progress.percent}%` }}
                              aria-valuenow={progress.percent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                          </div>
                          <div className="text-center text-muted mt-2">
                            {progress.percent}%
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="alert alert-danger" role="alert">
                        ❌ {error}
                      </div>
                    )}

                    {ocrData && !loading && (
                      <div className="card mb-4">
                        <div className="card-body">
                          <h5 className="card-title border-bottom border-primary border-3 pb-2 mb-3">
                            📄 ข้อมูลจากการอ่านสลิป (OCR)
                          </h5>

                          {ocrData.amount && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                💰 จำนวนเงิน
                              </small>
                              <div className="fs-4 fw-bold text-primary">
                                {parseFloat(ocrData.amount).toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}{" "}
                                บาท
                              </div>
                            </div>
                          )}

                          {ocrData.fee && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                💳 ค่าธรรมเนียม
                              </small>
                              <div className="fs-6">
                                {parseFloat(ocrData.fee).toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}{" "}
                                บาท
                              </div>
                            </div>
                          )}

                          {ocrData.date && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                📅 วันที่-เวลาทำรายการ
                              </small>
                              <div className="fs-6">
                                {formatDateTime(ocrData.date, ocrData.time)}
                              </div>
                            </div>
                          )}

                          {ocrData.reference && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                🔖 หมายเลขอ้างอิง
                              </small>
                              <div className="fs-6">
                                <span className="badge bg-success p-2 font-monospace">
                                  {ocrData.reference}
                                </span>
                              </div>
                            </div>
                          )}

                          {ocrData.transactionNo && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                🆔 เลขที่ธุรกรรม
                              </small>
                              <div className="fs-6">
                                <span className="badge bg-success p-2 font-monospace">
                                  {ocrData.transactionNo}
                                </span>
                              </div>
                            </div>
                          )}

                          {ocrData.transferType && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                📱 ประเภทการโอน
                              </small>
                              <div className="fs-6">{ocrData.transferType}</div>
                            </div>
                          )}

                          {ocrData.fromAccount && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                🏦 บัญชีต้นทาง
                              </small>
                              <div className="fs-6">{ocrData.fromAccount}</div>
                            </div>
                          )}

                          {ocrData.toAccount && (
                            <div className="mb-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                              <small className="text-muted fw-semibold d-block mb-1">
                                🏦 บัญชีปลายทาง
                              </small>
                              <div className="fs-6">{ocrData.toAccount}</div>
                            </div>
                          )}

                          {ocrTextFull && (
                            <div className="mt-3">
                              <button
                                className="btn btn-link p-0 text-decoration-underline"
                                onClick={() => setShowOcrText(!showOcrText)}
                              >
                                📝 {showOcrText ? "ซ่อน" : "ดู"}
                                ข้อความที่อ่านได้ทั้งหมด
                              </button>
                              {showOcrText && (
                                <pre
                                  className="bg-light p-3 rounded-3 mt-2 small text-muted overflow-auto"
                                  style={{
                                    maxHeight: "200px",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {ocrTextFull}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {qrData && !loading && (
                      <div className="card bg-primary text-white mb-4">
                        <div className="card-body">
                          <h5 className="card-title text-center mb-4">
                            📱 ข้อมูลจาก QR Code
                          </h5>

                          {qrData.amount && (
                            <div className="mb-3 p-3 rounded-3 bg-white bg-opacity-10">
                              <small className="d-block mb-1 opacity-75">
                                💰 จำนวนเงิน
                              </small>
                              <div className="fs-3 fw-bold">
                                {parseFloat(qrData.amount).toLocaleString(
                                  "th-TH",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}{" "}
                                บาท
                              </div>
                            </div>
                          )}

                          {qrData.merchantID && (
                            <div className="mb-3 p-3 rounded-3 bg-white bg-opacity-10">
                              <small className="d-block mb-1 opacity-75">
                                👤 PromptPay ID (ผู้รับเงิน)
                              </small>
                              <div className="fs-6">{qrData.merchantID}</div>
                            </div>
                          )}

                          {qrData.reference && (
                            <div className="mb-3 p-3 rounded-3 bg-white bg-opacity-10">
                              <small className="d-block mb-1 opacity-75">
                                🔖 เลขอ้างอิง
                              </small>
                              <div className="fs-6">
                                <span className="badge bg-light text-primary p-2 font-monospace">
                                  {qrData.reference}
                                </span>
                              </div>
                            </div>
                          )}

                          {qrData.billPaymentRef1 && (
                            <div className="mb-3 p-3 rounded-3 bg-white bg-opacity-10">
                              <small className="d-block mb-1 opacity-75">
                                📋 Ref 1
                              </small>
                              <div className="fs-6">
                                <span className="badge bg-light text-primary p-2 font-monospace">
                                  {qrData.billPaymentRef1}
                                </span>
                              </div>
                            </div>
                          )}

                          {qrData.billPaymentRef2 && (
                            <div className="mb-3 p-3 rounded-3 bg-white bg-opacity-10">
                              <small className="d-block mb-1 opacity-75">
                                📋 Ref 2
                              </small>
                              <div className="fs-6">
                                <span className="badge bg-light text-primary p-2 font-monospace">
                                  {qrData.billPaymentRef2}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {jsonOutput && !loading && (
                      <div className="card bg-dark text-light mb-4">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                            <h6 className="mb-0 text-info">
                              📋 JSON Output
                            </h6>
                            <button
                              className={`btn btn-sm ${
                                copySuccess ? "btn-success" : "btn-primary"
                              }`}
                              onClick={copyJsonToClipboard}
                            >
                              {copySuccess ? "✓ Copied!" : "📋 Copy JSON"}
                            </button>
                          </div>
                          <pre
                            className="bg-black p-3 rounded-3 text-light mb-0 small overflow-auto"
                            style={{
                              maxHeight: "400px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {JSON.stringify(jsonOutput, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {!loading && (
                      <div className="text-center">
                        <button
                          className="btn btn-primary btn-lg text-white rounded-pill"
                          onClick={resetUpload}
                        >
                          📤 อัปโหลดสลิปใหม่
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Only render the full UI if not embedded */}
      {!isEmbedded && (
        <div className="container">
          {" "}
          {/* Original full UI content goes here */}{" "}
        </div>
      )}
    </div>
  );
}
