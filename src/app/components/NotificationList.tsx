'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Notification {
  _id: string;
  userId: string;
  type: 'paymentReminder' | 'paymentVerified' | 'paymentRejected' | 'overdue' | 'billGenerated' | 'maintenance' | 'general';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationListProps {
  userId?: string;
  limit?: number;
  showRead?: boolean;
  refreshTrigger?: number;
}

export default function NotificationList({ 
  userId, 
  limit = 10, 
  showRead = false,
  refreshTrigger = 0
}: NotificationListProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [userId, limit, showRead, refreshTrigger]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || session?.user?.id;
      
      if (!targetUserId) {
        setNotifications([]);
        return;
      }

      const params = new URLSearchParams({
        userId: targetUserId,
        limit: limit.toString(),
        includeRead: showRead.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'paymentReminder':
        return 'bi-clock-history text-warning';
      case 'paymentVerified':
        return 'bi-check-circle text-success';
      case 'paymentRejected':
        return 'bi-x-circle text-danger';
      case 'overdue':
        return 'bi-exclamation-triangle text-danger';
      case 'billGenerated':
        return 'bi-file-earmark-text text-info';
      case 'maintenance':
        return 'bi-tools text-warning';
      default:
        return 'bi-info-circle text-primary';
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'เมื่อสักครู่';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ชั่วโมงที่แล้ว`;
    } else if (diffInHours < 48) {
      return 'เมื่อวานนี้';
    } else {
      return format(date, 'd MMMM yyyy', { locale: th });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <i className="bi bi-bell-slash fs-1 d-block mb-2"></i>
        <p>ไม่มีการแจ้งเตือน</p>
      </div>
    );
  }

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={`card mb-2 ${!notification.read ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => !notification.read && markAsRead(notification._id)}
        >
          <div className="card-body py-2">
            <div className="d-flex align-items-start">
              <div className="me-3">
                <i className={`bi ${getNotificationIcon(notification.type)} fs-5`}></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className={`mb-1 ${!notification.read ? 'fw-bold' : ''}`}>
                    {notification.title}
                  </h6>
                  <small className="text-muted ms-2">
                    {formatNotificationDate(notification.createdAt)}
                  </small>
                </div>
                <p className="mb-0 small">{notification.message}</p>
                {notification.data && (
                  <div className="mt-2">
                    {notification.data.billId && (
                      <small className="text-muted">
                        บิล #{notification.data.billId}
                      </small>
                    )}
                    {notification.data.paymentId && (
                      <small className="text-muted ms-2">
                        การชำระ #{notification.data.paymentId}
                      </small>
                    )}
                  </div>
                )}
              </div>
              <div className="ms-2">
                {!notification.read && (
                  <span className="badge bg-primary">ใหม่</span>
                )}
                {markingAsRead === notification._id && (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">กำลังอัปเดต...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}