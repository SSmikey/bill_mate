import mongoose, { Schema, Model } from 'mongoose';

export interface IBill extends mongoose.Document {
  roomId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  rentAmount: number;
  waterUnits: number; // Changed from waterAmount to waterUnits
  waterAmount: number; // Calculated amount based on units and rate
  electricityUnits: number; // Changed from electricityAmount to electricityUnits
  electricityAmount: number; // Calculated amount based on units and rate
  totalAmount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'verified';
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    rentAmount: { type: Number, required: true, min: 0 },
    waterUnits: { type: Number, required: true, min: 0 },
    waterAmount: { type: Number, required: true, min: 0 },
    electricityUnits: { type: Number, required: true, min: 0 },
    electricityAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'verified'],
      default: 'pending'
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate bills
BillSchema.index({ roomId: 1, month: 1, year: 1 }, { unique: true });
BillSchema.index({ tenantId: 1 });
BillSchema.index({ status: 1 });
BillSchema.index({ dueDate: 1 });

const Bill: Model<IBill> = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;
