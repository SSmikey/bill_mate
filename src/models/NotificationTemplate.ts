// src/models/NotificationTemplate.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface INotificationTemplate {
  _id: string;
  type: 'payment_reminder' | 'payment_verified' | 'payment_rejected' | 'overdue' | 'bill_generated';
  name: string;
  subject: string;
  emailBody: string;
  inAppTitle: string;
  inAppMessage: string;
  variables: string[];
  isActive: boolean;
  version: number;
  lastModifiedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    type: {
      type: String,
      required: true,
      enum: ['payment_reminder', 'payment_verified', 'payment_rejected', 'overdue', 'bill_generated'],
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    emailBody: {
      type: String,
      required: true
    },
    inAppTitle: {
      type: String,
      required: true,
      trim: true
    },
    inAppMessage: {
      type: String,
      required: true
    },
    variables: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    version: {
      type: Number,
      default: 1
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Index
NotificationTemplateSchema.index({ type: 1 });
NotificationTemplateSchema.index({ isActive: 1 });

// Method: Replace variables in template
NotificationTemplateSchema.methods.render = function(data: Record<string, any>) {
  let subject = this.subject;
  let emailBody = this.emailBody;
  let inAppTitle = this.inAppTitle;
  let inAppMessage = this.inAppMessage;

  // Replace all variables
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, data[key]);
    emailBody = emailBody.replace(regex, data[key]);
    inAppTitle = inAppTitle.replace(regex, data[key]);
    inAppMessage = inAppMessage.replace(regex, data[key]);
  });

  return {
    subject,
    emailBody,
    inAppTitle,
    inAppMessage
  };
};

const NotificationTemplate = models.NotificationTemplate || 
  model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);

export default NotificationTemplate;