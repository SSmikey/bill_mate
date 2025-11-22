'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
}

export default function Navbar() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data);
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });

      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  if (!session) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand fw-bold">
          <i className="bi bi-house-check me-2"></i>
          Bill Mate
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {/* Notifications */}
            <li className="nav-item dropdown me-3">
              <button
                className="btn btn-link nav-link position-relative"
                id="notificationDropdown"
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ color: 'white' }}
              >
                <i className="bi bi-bell fs-5"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <ul className="dropdown-menu dropdown-menu-end show" style={{ minWidth: '350px', maxHeight: '400px', overflowY: 'auto' }}>
                  <li>
                    <h6 className="dropdown-header">การแจ้งเตือน</h6>
                  </li>
                  {notifications.length === 0 ? (
                    <li>
                      <div className="dropdown-item text-center text-muted py-3">
                        ไม่มีการแจ้งเตือน
                      </div>
                    </li>
                  ) : (
                    notifications.map((notif) => (
                      <li key={notif._id}>
                        <div
                          className={`dropdown-item cursor-pointer ${!notif.read ? 'bg-light' : ''}`}
                          onClick={() => markAsRead(notif._id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="fw-bold small">{notif.title}</div>
                          <div className="small text-muted">{notif.message}</div>
                        </div>
                      </li>
                    ))
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <Link href="/notifications" className="dropdown-item text-center small">
                      ดูทั้งหมด
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* User Menu */}
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle"
                id="userDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ color: 'white' }}
              >
                <i className="bi bi-person-circle me-2"></i>
                {session.user?.name || 'ผู้ใช้'}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <div className="dropdown-item disabled">
                    <small className="text-muted">{session.user?.email}</small>
                  </div>
                </li>
                <li>
                  <div className="dropdown-item disabled">
                    <small className="text-muted">
                      บทบาท:{' '}
                      <span className="badge bg-info">
                        {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                      </span>
                    </small>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link href="/profile" className="dropdown-item">
                    <i className="bi bi-gear me-2"></i>
                    ตั้งค่าโปรไฟล์
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    ออกจากระบบ
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
