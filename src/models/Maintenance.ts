import mongoose, { Schema, Model } from 'mongoose';
import type {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
} from '@/types/maintenance';

/**
 * Maintenance Model
 * เก็บข้อมูลการแจ้งซ่อมและบำรุงรักษาห้องพัก
 */

export interface IMaintenanceDocument extends mongoose.Document {
  roomId: mongoose.Types.ObjectId; // Reference to Room
  tenantId?: mongoose.Types.ObjectId; // Reference to User (tenant) - optional if admin creates
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  assignedTo?: string; // ชื่อช่างหรือผู้รับผิดชอบ
  notes?: string;
  images?: string[]; // URLs or paths to images
  createdBy: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: 'admin' | 'tenant';
  };
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenanceDocument>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User' },
    category: {
      type: String,
      enum: ['electrical', 'plumbing', 'air-conditioning', 'furniture', 'cleaning', 'security', 'other'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    reportedDate: { type: Date, required: true, default: Date.now },
    scheduledDate: { type: Date },
    completedDate: { type: Date },
    cost: { type: Number, min: 0, max: 1000000 },
    assignedTo: { type: String },
    notes: { type: String },
    images: [{ type: String }],
    createdBy: {
      userId: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      role: { type: String, enum: ['admin', 'tenant'], required: true },
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
MaintenanceSchema.index({ roomId: 1 });
MaintenanceSchema.index({ tenantId: 1 });
MaintenanceSchema.index({ status: 1 });
MaintenanceSchema.index({ priority: 1 });
MaintenanceSchema.index({ reportedDate: -1 });

const Maintenance: Model<IMaintenanceDocument> =
  mongoose.models.Maintenance ||
  mongoose.model<IMaintenanceDocument>('Maintenance', MaintenanceSchema);

export default Maintenance;