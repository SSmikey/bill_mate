'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import NotificationList from './NotificationList';

interface NotificationDropdownProps {
  className?: string;
}

export default function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [refreshTrigger]);

  const fetchUnreadCount = async () => {
    try {
      if (!session?.user?.id) return;
      
      const response = await fetch(`/api/notifications?userId=${session.user.id}&unreadOnly=true&limit=1`);
      const data = await response.json();

      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Refresh notifications when opening dropdown
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!session?.user?.id) return;
      
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        setUnreadCount(0);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <button
        className="btn btn-light position-relative rounded-circle shadow-sm"
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        style={{ width: '40px', height: '40px' }}
      >
        <i className="bi bi-bell text-secondary" style={{ fontSize: '1.2rem' }}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div className={`dropdown-menu dropdown-menu-end shadow-lg border-0 ${isOpen ? 'show' : ''}`} style={{ width: '380px', maxHeight: '450px' }}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-bell-fill text-primary" style={{ fontSize: '1.2rem' }}></i>
            <h6 className="mb-0 fw-semibold">การแจ้งเตือน</h6>
            {unreadCount > 0 && (
              <span className="badge bg-primary">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm btn-outline-primary rounded-pill"
              onClick={markAllAsRead}
            >
              <i className="bi bi-check-all"></i>
              <span className="d-none d-sm-inline ms-1">อ่านทั้งหมด</span>
            </button>
          )}
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <NotificationList
            limit={5}
            showRead={false}
            refreshTrigger={refreshTrigger}
          />
        </div>

        <div className="p-3 border-top bg-light">
          <a href="/notifications" className="btn btn-sm btn-outline-primary w-100 rounded-pill">
            <i className="bi bi-arrow-right"></i>
            <span className="d-none d-sm-inline ms-1">ดูทั้งหมด</span>
          </a>
        </div>
      </div>
    </div>
  );
}