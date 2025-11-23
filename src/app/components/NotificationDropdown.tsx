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
        className="btn btn-outline-secondary position-relative"
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <div className={`dropdown-menu dropdown-menu-end p-0 ${isOpen ? 'show' : ''}`} style={{ width: '350px', maxHeight: '400px' }}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h6 className="mb-0">การแจ้งเตือน</h6>
          {unreadCount > 0 && (
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={markAllAsRead}
            >
              อ่านทั้งหมด
            </button>
          )}
        </div>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <NotificationList 
            limit={5} 
            showRead={false}
            refreshTrigger={refreshTrigger}
          />
        </div>
        
        <div className="p-2 border-top text-center">
          <a href="/notifications" className="btn btn-sm btn-link text-decoration-none">
            ดูการแจ้งเตือนทั้งหมด
          </a>
        </div>
      </div>
    </div>
  );
}