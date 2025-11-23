// src/models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

// Interface สำหรับ Notification Preferences
export interface INotificationPreferences {
  email: {
    enabled: boolean;
    paymentReminder: boolean;
    paymentVerified: boolean;
    paymentRejected: boolean;
    overdue: boolean;
    billGenerated: boolean;
  };
  inApp: {
    enabled: boolean;
    paymentReminder: boolean;
    paymentVerified: boolean;
    paymentRejected: boolean;
    overdue: boolean;
    billGenerated: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // Format: "HH:mm" เช่น "22:00"
    endTime: string;   // Format: "HH:mm" เช่น "08:00"
  };
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'tenant';
  phone?: string;
  idCard?: string;
  emergencyContact?: string;
  
  // ⭐ เพิ่ม notification preferences
  notificationPreferences?: INotificationPreferences;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'tenant'],
      default: 'tenant'
    },
    phone: {
      type: String,
      trim: true
    },
    idCard: {
      type: String,
      trim: true
    },
    emergencyContact: {
      type: String,
      trim: true
    },
    
    // ⭐ เพิ่ม notification preferences schema
    notificationPreferences: {
      type: {
        email: {
          enabled: { type: Boolean, default: true },
          paymentReminder: { type: Boolean, default: true },
          paymentVerified: { type: Boolean, default: true },
          paymentRejected: { type: Boolean, default: true },
          overdue: { type: Boolean, default: true },
          billGenerated: { type: Boolean, default: true }
        },
        inApp: {
          enabled: { type: Boolean, default: true },
          paymentReminder: { type: Boolean, default: true },
          paymentVerified: { type: Boolean, default: true },
          paymentRejected: { type: Boolean, default: true },
          overdue: { type: Boolean, default: true },
          billGenerated: { type: Boolean, default: true }
        },
        quietHours: {
          enabled: { type: Boolean, default: false },
          startTime: { type: String, default: '22:00' },
          endTime: { type: String, default: '08:00' }
        }
      },
      // ค่า default ถ้าไม่มี preferences
      default: () => ({
        email: {
          enabled: true,
          paymentReminder: true,
          paymentVerified: true,
          paymentRejected: true,
          overdue: true,
          billGenerated: true
        },
        inApp: {
          enabled: true,
          paymentReminder: true,
          paymentVerified: true,
          paymentRejected: true,
          overdue: true,
          billGenerated: true
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      })
    }
  },
  {
    timestamps: true
  }
);

// Index
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// ⭐ Method: ตรวจสอบว่าควรส่งการแจ้งเตือนหรือไม่
UserSchema.methods.shouldSendNotification = function(
  type: 'email' | 'inApp',
  notificationType: 'paymentReminder' | 'paymentVerified' | 'paymentRejected' | 'overdue' | 'billGenerated'
): boolean {
  const prefs = this.notificationPreferences;
  
  if (!prefs) return true; // ถ้าไม่มี preferences ให้ส่งทุกอย่าง
  
  // ตรวจสอบว่า channel นี้เปิดใช้งานหรือไม่
  if (!prefs[type].enabled) return false;
  
  // ตรวจสอบว่าประเภทการแจ้งเตือนนี้เปิดใช้งานหรือไม่
  if (!prefs[type][notificationType]) return false;
  
  // ตรวจสอบ quiet hours (เฉพาะ email)
  if (type === 'email' && prefs.quietHours.enabled) {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { startTime, endTime } = prefs.quietHours;
    
    // ถ้า quiet hours ข้ามวัน (เช่น 22:00 - 08:00)
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime <= endTime) {
        return false; // อยู่ใน quiet hours
      }
    } else {
      // quiet hours ไม่ข้ามวัน (เช่น 01:00 - 06:00)
      if (currentTime >= startTime && currentTime <= endTime) {
        return false; // อยู่ใน quiet hours
      }
    }
  }
  
  return true;
};

// ⭐ Static Method: หา users ที่ควรได้รับการแจ้งเตือน
UserSchema.statics.findUsersForNotification = async function(
  userIds: string[],
  type: 'email' | 'inApp',
  notificationType: 'paymentReminder' | 'paymentVerified' | 'paymentRejected' | 'overdue' | 'billGenerated'
) {
  const users = await this.find({ _id: { $in: userIds } });
  
  return users.filter(user => 
    user.shouldSendNotification(type, notificationType)
  );
};

const User = models.User || model<IUser>('User', UserSchema);

export default User;