import mongoose, { Schema, Model } from 'mongoose';

export interface IRoom extends mongoose.Document {
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
  isOccupied: boolean;
  tenantId?: mongoose.Types.ObjectId;
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
  },
  { timestamps: true }
);

// Index for faster queries
RoomSchema.index({ roomNumber: 1 });
RoomSchema.index({ isOccupied: 1 });

const Room: Model<IRoom> = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
