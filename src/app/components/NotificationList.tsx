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

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

interface NotificationListProps {
  userId?: string;
  limit?: number;
  showRead?: boolean;
  refreshTrigger?: number;
  onStatsUpdate?: (stats: NotificationStats) => void;
}

export default function NotificationList({
  userId,
  limit = 10,
  showRead = false,
  refreshTrigger = 0,
  onStatsUpdate
}: NotificationListProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set());

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
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data?.notifications || []);
        
        // Update stats if callback provided
        if (onStatsUpdate && result.data?.stats) {
          onStatsUpdate(result.data.stats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Prevent multiple clicks on same notification
    if (markingAsRead.has(notificationId)) return;
    
    try {
      setMarkingAsRead(prev => new Set(prev).add(notificationId));
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
        
        // Update stats if callback provided
        if (onStatsUpdate) {
          // Get current stats from notifications
          const currentUnread = notifications.filter(n => !n.read && n._id !== notificationId).length;
          const currentRead = notifications.filter(n => n.read || n._id === notificationId).length;
          
          onStatsUpdate({
            total: notifications.length,
            unread: currentUnread,
            read: currentRead
          });
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
        <p className="mt-3 text-muted">กำลังโหลดการแจ้งเตือน...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="rounded-circle p-4 bg-light bg-opacity-50 mb-4 d-inline-block animate-slide-in-top">
          <i className="bi bi-bell-slash fs-1 text-muted" style={{ fontSize: '3rem' }}></i>
        </div>
        <h5 className="text-muted mb-3 animate-slide-in-top" style={{ animationDelay: '0.1s' }}>
          {showRead ? 'ไม่มีการแจ้งเตือน' : 'ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน'}
        </h5>
        <p className="text-muted animate-slide-in-top" style={{ animationDelay: '0.2s' }}>
          {showRead
            ? 'คุณไม่มีการแจ้งเตือนในขณะนี้'
            : 'การแจ้งเตือนทั้งหมดของคุณได้ถูกอ่านแล้ว'
          }
        </p>
        {!showRead && (
          <button
            className="btn btn-outline-primary rounded-2 mt-3 animate-slide-in-top"
            style={{ animationDelay: '0.3s' }}
            onClick={() => window.location.reload()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            รีเฟรช
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={`card border bg-white rounded-3 shadow-sm mb-3 transition-all duration-200 hover-lift notification-list-item ${
            !notification.read ? 'border-primary border-2' : 'border-light'
          }`}
          style={{ cursor: notification.read && !markingAsRead.has(notification._id) ? 'default' : 'pointer' }}
          onClick={() => !notification.read && !markingAsRead.has(notification._id) && markAsRead(notification._id)}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-start">
              <div className="me-3">
                <div className={`rounded-circle p-3 bg-opacity-10 transition-all duration-200 ${
                  notification.type === 'paymentReminder' ? 'bg-warning' :
                  notification.type === 'paymentVerified' ? 'bg-success' :
                  notification.type === 'paymentRejected' ? 'bg-danger' :
                  notification.type === 'overdue' ? 'bg-danger' :
                  notification.type === 'billGenerated' ? 'bg-info' :
                  notification.type === 'maintenance' ? 'bg-warning' :
                  'bg-primary'
                }`}>
                  <i className={`bi ${getNotificationIcon(notification.type)} fs-5`} style={{ fontSize: '1.2rem' }}></i>
                </div>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className={`mb-0 transition-all duration-200 ${
                    !notification.read ? 'fw-bold text-dark' : 'fw-medium text-dark'
                  }`}>
                    {notification.title}
                  </h6>
                  <small className="text-muted ms-2">
                    {formatNotificationDate(notification.createdAt)}
                  </small>
                </div>
                <p className="mb-2 text-dark">{notification.message}</p>
                {notification.data && (
                  <div className="d-flex gap-2 flex-wrap">
                    {notification.data.billId && (
                      <span className="badge bg-light text-dark border rounded-2 px-2 py-1">
                        <i className="bi bi-receipt me-1"></i>
                        บิล #{notification.data.billId}
                      </span>
                    )}
                    {notification.data.paymentId && (
                      <span className="badge bg-light text-dark border rounded-2 px-2 py-1">
                        <i className="bi bi-credit-card me-1"></i>
                        การชำระ #{notification.data.paymentId}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="ms-3">
                {!notification.read && (
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary rounded-2 px-2 py-1">
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                    ใหม่
                  </span>
                )}
                {markingAsRead.has(notification._id) && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
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