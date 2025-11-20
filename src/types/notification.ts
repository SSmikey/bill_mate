export type NotificationType = 'payment_reminder' | 'payment_verified' | 'payment_rejected' | 'bill_generated' | 'overdue';

export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  billId?: string;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  billId?: string;
}

export interface SendPaymentReminderDto {
  daysBefore: number;
}
