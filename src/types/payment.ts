export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface OCRData {
  amount?: number;
  fee?: number;
  date?: string;
  time?: string;
  fromAccount?: string;
  toAccount?: string;
  reference?: string;
  transactionNo?: string;
}

export interface QRData {
  merchantId?: string;
  amount?: number;
  ref1?: string;
  ref2?: string;
}

export interface PaymentData {
  id: string;
  billId: string;
  userId: string;
  slipImageUrl: string;
  ocrData: OCRData;
  qrData?: QRData;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface UploadPaymentDto {
  billId: string;
  slipImageBase64: string;
  ocrData?: OCRData;
  qrData?: QRData;
}

export interface VerifyPaymentDto {
  paymentId: string;
  approved: boolean;
  rejectionReason?: string;
}
