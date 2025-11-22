import mongoose, { Schema, Model } from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'admin' | 'tenant';
  roomId?: mongoose.Types.ObjectId;
  notificationPreferences?: {
    emailNotifications: boolean;
    reminder5Days: boolean;
    reminder1Day: boolean;
    overdueNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['admin', 'tenant'], default: 'tenant' },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      reminder5Days: { type: Boolean, default: true },
      reminder1Day: { type: Boolean, default: true },
      overdueNotifications: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
