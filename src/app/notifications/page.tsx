// src/app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Notification {
  _id: string;
  type: 'payment_reminder' | 'payment_verified' | 'payment_rejected' | 'overdue' | 'bill_generated';
  title: string;
  message: string;
  billId?: {
    _id: string;
    roomId: {
      roomNumber: string;
    };
  };
  read: boolean;
  sentAt: string;
  readAt?: string;
}

type FilterStatus = 'all' | 'unread' | 'read';
type FilterType = 'all' | 'payment_reminder' | 'payment_verified' | 'payment_rejected' | 'overdue' | 'bill_generated';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Redirect ถ้ายังไม่ login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch notifications
  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      alert('เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน');
    } finally {
      setLoading(false);
    }
  }

  // Mark as read
  async function markAsRead(notificationId: string) {
    try {
      setActionLoading(notificationId);
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      const result = await response.json();

      if (result.success) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(null);
    }
  }

  // Mark all as read
  async function markAllAsRead() {
    const unreadIds = notifications
      .filter(n => !n.read)
      .map(n => n._id);

    if (unreadIds.length === 0) {
      alert('ไม่มีการแจ้งเตือนที่ยังไม่อ่าน');
      return;
    }

    if (!confirm(`ต้องการทำเครื่องหมายว่าอ่านแล้วทั้งหมด ${unreadIds.length} รายการ?`)) {
      return;
    }

    try {
      setLoading(true);
      
      for (const id of unreadIds) {
        await markAsRead(id);
      }
      
      await fetchNotifications();
      alert('ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อย');
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  // Delete notification
  async function deleteNotification(id: string) {
    if (!confirm('ต้องการลบการแจ้งเตือนนี้?')) {
      return;
    }

    try {
      setActionLoading(id);
      
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchNotifications();
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(null);
    }
  }

  // Delete all read
  async function deleteAllRead() {
    const readIds = notifications
      .filter(n => n.read)
      .map(n => n._id);

    if (readIds.length === 0) {
      alert('ไม่มีการแจ้งเตือนที่อ่านแล้วให้ลบ');
      return;
    }

    if (!confirm(`ต้องการลบการแจ้งเตือนที่อ่านแล้วทั้งหมด ${readIds.length} รายการ?`)) {
      return;
    }

    try {
      setLoading(true);
      
      for (const id of readIds) {
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      }
      
      await fetchNotifications();
      alert('ลบการแจ้งเตือนที่อ่านแล้วเรียบร้อย');
    } catch (error) {
      console.error('Error deleting all read:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filter by status
    if (filterStatus === 'unread' && notification.read) return false;
    if (filterStatus === 'read' && !notification.read) return false;
    
    // Filter by type
    if (filterType !== 'all' && notification.type !== filterType) return false;
    
    return true;
  });

  // Get icon and color
  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'payment_reminder': return '🔔';
      case 'payment_verified': return '✅';
      case 'payment_rejected': return '❌';
      case 'overdue': return '⚠️';
      case 'bill_generated': return '📄';
      default: return '📌';
    }
  }

  function getNotificationColor(type: Notification['type']) {
    switch (type) {
      case 'payment_reminder': return 'warning';
      case 'payment_verified': return 'success';
      case 'payment_rejected': return 'danger';
      case 'overdue': return 'danger';
      case 'bill_generated': return 'info';
      default: return 'secondary';
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3">กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="bi bi-bell"></i> การแจ้งเตือนของฉัน
              {unreadCount > 0 && (
                <span className="badge bg-danger ms-2">{unreadCount}</span>
              )}
            </h2>
          </div>

          {/* Filters & Actions */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                {/* Status Filter */}
                <div className="col-md-3">
                  <label className="form-label small">สถานะ:</label>
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  >
                    <option value="all">ทั้งหมด ({notifications.length})</option>
                    <option value="unread">ยังไม่อ่าน ({unreadCount})</option>
                    <option value="read">อ่านแล้ว ({readCount})</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="col-md-4">
                  <label className="form-label small">ประเภท:</label>
                  <select
                    className="form-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="payment_reminder">🔔 เตือนการชำระ</option>
                    <option value="payment_verified">✅ อนุมัติการชำระ</option>
                    <option value="payment_rejected">❌ ปฏิเสธการชำระ</option>
                    <option value="overdue">⚠️ เกินกำหนด</option>
                    <option value="bill_generated">📄 สร้างบิลใหม่</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="col-md-5">
                  <label className="form-label small">จัดการ:</label>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0 || loading}
                    >
                      <i className="bi bi-check-all"></i> อ่านทั้งหมด
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={deleteAllRead}
                      disabled={readCount === 0 || loading}
                    >
                      <i className="bi bi-trash"></i> ลบที่อ่านแล้ว
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="alert alert-info">
              <i className="bi bi-info-circle"></i> ไม่มีการแจ้งเตือน
            </div>
          ) : (
            <div className="list-group">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`list-group-item list-group-item-action ${
                    !notification.read ? 'border-primary border-2' : ''
                  }`}
                >
                  <div className="d-flex w-100 justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="mb-1">
                        {getNotificationIcon(notification.type)}{' '}
                        {!notification.read && (
                          <span className="badge bg-danger">NEW</span>
                        )}{' '}
                        {notification.title}
                      </h6>
                      <p className="mb-2 text-muted">{notification.message}</p>
                      <small className="text-muted">
                        <i className="bi bi-clock"></i>{' '}
                        {format(new Date(notification.sentAt), 'dd/MM/yyyy HH:mm', { locale: th })}
                      </small>
                    </div>

                    <div className="d-flex gap-2 ms-3">
                      {notification.billId && (
                        <Link
                          href={`/tenant/bills/${notification.billId._id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-file-text"></i> ดูบิล
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => markAsRead(notification._id)}
                          disabled={actionLoading === notification._id}
                        >
                          <i className="bi bi-check"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteNotification(notification._id)}
                        disabled={actionLoading === notification._id}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}