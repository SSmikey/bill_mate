import mongoose, { Schema, Model } from 'mongoose';

export interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: 'payment_reminder' | 'payment_verified' | 'payment_rejected' | 'bill_generated' | 'overdue';
  title: string;
  message: string;
  billId?: mongoose.Types.ObjectId;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['payment_reminder', 'payment_verified', 'payment_rejected', 'bill_generated', 'overdue'],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    billId: { type: Schema.Types.ObjectId, ref: 'Bill' },
    read: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
    readAt: Date,
  },
  { timestamps: true }
);

// Index for faster queries
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ sentAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
