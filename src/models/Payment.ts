import mongoose, { Schema, Model } from 'mongoose';

export interface IPayment extends mongoose.Document {
  billId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  slipImageUrl: string; // URL to fetch the image from API
  slipImageData?: string; // Base64 image stored in database
  ocrData: {
    amount?: number;
    fee?: number;
    date?: string;
    time?: string;
    fromAccount?: string;
    toAccount?: string;
    reference?: string;
    transactionNo?: string;
  };
  qrData?: {
    merchantId?: string;
    amount?: number;
    ref1?: string;
    ref2?: string;
  };
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    billId: { type: Schema.Types.ObjectId, ref: 'Bill', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slipImageUrl: { type: String, required: true },
    slipImageData: { type: String }, // Base64 image stored in database
    ocrData: {
      amount: Number,
      fee: Number,
      date: String,
      time: String,
      fromAccount: String,
      toAccount: String,
      reference: String,
      transactionNo: String,
    },
    qrData: {
      merchantId: String,
      amount: Number,
      ref1: String,
      ref2: String,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

// Index for faster queries
PaymentSchema.index({ billId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
