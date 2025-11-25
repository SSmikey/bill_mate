'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotificationList from '@/app/components/NotificationList';

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, read: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    fetchNotificationStats();
  }, [status, session, router]);

  const fetchNotificationStats = async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/notifications/stats?userId=${session?.user?.id}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data || { total: 0, unread: 0, read: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'unread') => {
    if (activeTab === tab) return; // Prevent unnecessary re-renders
    setActiveTab(tab);
    setRefreshTrigger(prev => prev + 1);
  };

  const markAllAsRead = async () => {
    if (isMarkingAll || stats.unread === 0) return; // Prevent multiple clicks
    
    try {
      setIsMarkingAll(true);
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user?.id }),
      });
      
      if (response.ok) {
        setStats(prev => ({ ...prev, unread: 0, read: prev.total }));
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-80">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <h5 className="text-muted">กำลังโหลด...</h5>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="fade-in notifications-page">
      <div className="container-lg py-4">
        {/* Enhanced Header with user info */}
        <div className="mb-5">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="fw-bold text-dark mb-2">การแจ้งเตือน</h1>
            <p className="text-muted mb-0">จัดการและตรวจสอบการแจ้งเตือนทั้งหมดของคุณ</p>
          </div>
          <div className="text-end">
            <div className="text-muted small">วันนี้</div>
            <div className="fw-semibold">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-5 g-3">
        <div className="col-md-4">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm stats-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">การแจ้งเตือนทั้งหมด</p>
                  <h3 className="mb-0 fw-bold text-dark">{loadingStats ? '-' : stats.total}</h3>
                </div>
                <div className="rounded-circle p-3 bg-primary bg-opacity-10">
                  <i className="bi bi-bell-fill fs-4 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm stats-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ยังไม่ได้อ่าน</p>
                  <h3 className="mb-0 fw-bold text-warning">{loadingStats ? '-' : stats.unread}</h3>
                </div>
                <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                  <i className="bi bi-envelope-fill fs-4 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm stats-card">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">อ่านแล้ว</p>
                  <h3 className="mb-0 fw-bold text-success">{loadingStats ? '-' : stats.read}</h3>
                </div>
                <div className="rounded-circle p-3 bg-success bg-opacity-10">
                  <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card border-0 bg-white rounded-3 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
              <div className="rounded-circle p-3 me-3 bg-info bg-opacity-10">
                <i className="bi bi-bell-fill fs-5 text-info"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-semibold text-dark">การแจ้งเตือน</h6>
                <p className="mb-0 small text-muted">จัดการการแจ้งเตือนของคุณ</p>
              </div>
            </div>
            
            {stats.unread > 0 && (
              <button
                className="btn btn-sm btn-outline-primary rounded-2"
                onClick={markAllAsRead}
                disabled={isMarkingAll}
              >
                {isMarkingAll ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">กำลังอัปเดต...</span>
                    </div>
                    กำลังอัปเดต...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-all me-2"></i>
                    ทำเครื่องหมายว่าอ่านทั้งหมด
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Enhanced Tab Navigation */}
          <div className="d-flex gap-2 mb-4">
            <button
              className={`btn rounded-2 px-4 py-2 fw-medium position-relative ${
                activeTab === 'unread'
                  ? 'btn-primary text-white'
                  : 'btn-outline-primary text-primary'
              }`}
              onClick={() => handleTabChange('unread')}
              disabled={activeTab === 'unread'}
            >
              <i className="bi bi-envelope-fill me-2"></i>
              ยังไม่ได้อ่าน
              {stats.unread > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {stats.unread}
                </span>
              )}
            </button>
            <button
              className={`btn rounded-2 px-4 py-2 fw-medium ${
                activeTab === 'all'
                  ? 'btn-primary text-white'
                  : 'btn-outline-primary text-primary'
              }`}
              onClick={() => handleTabChange('all')}
              disabled={activeTab === 'all'}
            >
              <i className="bi bi-list-ul me-2"></i>
              ทั้งหมด
            </button>
          </div>

          <NotificationList
            showRead={activeTab === 'all'}
            limit={50}
            refreshTrigger={refreshTrigger}
            onStatsUpdate={setStats}
          />
        </div>
      </div>
      </div>
    </div>
  );
}