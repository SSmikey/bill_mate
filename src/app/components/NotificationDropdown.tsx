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
        className="btn position-relative border-0 shadow-sm"
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9'
        }}
      >
        <i className="bi bi-bell" style={{ color: '#64748b' }}></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" style={{ backgroundColor: '#ef4444', border: '2px solid #ffffff' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div className={`dropdown-menu dropdown-menu-end p-0 shadow-lg border-0 ${isOpen ? 'show' : ''}`} style={{
        width: '380px',
        maxHeight: '450px',
        borderRadius: '0.75rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0'
      }}>
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div className="d-flex align-items-center">
            <i className="bi bi-bell-fill me-2" style={{ color: '#4361ee' }}></i>
            <h6 className="mb-0 fw-semibold" style={{ color: '#0f172a' }}>การแจ้งเตือน</h6>
            {unreadCount > 0 && (
              <span className="badge ms-2" style={{ backgroundColor: '#4361ee' }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-sm rounded-pill"
              onClick={markAllAsRead}
              style={{
                border: '1px solid #4361ee',
                color: '#4361ee',
                backgroundColor: 'transparent'
              }}
            >
              <i className="bi bi-check-all me-1"></i>
              อ่านทั้งหมด
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
        
        <div className="p-3 border-top" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <a href="/notifications" className="btn btn-sm w-100 rounded-pill text-decoration-none" style={{
            border: '1px solid #4361ee',
            color: '#4361ee',
            backgroundColor: 'transparent'
          }}>
            <i className="bi bi-arrow-right me-1"></i>
            ดูการแจ้งเตือนทั้งหมด
          </a>
        </div>
      </div>
    </div>
  );
}