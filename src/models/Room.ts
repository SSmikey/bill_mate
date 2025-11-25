import mongoose, { Schema, Model } from 'mongoose';

export interface IRoom extends mongoose.Document {
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
  isOccupied: boolean;
  tenantId?: mongoose.Types.ObjectId;
  moveInDate?: Date;
  moveOutDate?: Date;
  rentDueDate?: number; // 1-31
  depositAmount?: number;
  assignmentNotes?: string;
  rentalAgreement?: string; // Path to rental agreement file
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: { type: String, required: true, unique: true },
    floor: { type: Number },
    rentPrice: { type: Number, required: true, min: 0 },
    waterPrice: { type: Number, required: true, min: 0 },
    electricityPrice: { type: Number, required: true, min: 0 },
    isOccupied: { type: Boolean, default: false },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User' },
    moveInDate: { type: Date },
    moveOutDate: { type: Date },
    rentDueDate: { type: Number, min: 1, max: 31 },
    depositAmount: { type: Number, min: 0 },
    assignmentNotes: { type: String },
    rentalAgreement: { type: String },
  },
  { timestamps: true }
);

// Index for faster queries
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ isOccupied: 1 });
RoomSchema.index({ tenantId: 1 });
RoomSchema.index({ floor: 1 });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
