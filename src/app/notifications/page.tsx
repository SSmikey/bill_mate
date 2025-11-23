'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NotificationList from '@/app/components/NotificationList';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [status, session, router]);

  const handleTabChange = (tab: 'all' | 'unread') => {
    setActiveTab(tab);
    setRefreshTrigger(prev => prev + 1);
  };

  if (status === 'loading') {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>การแจ้งเตือน</h2>
          </div>

          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'unread' ? 'active' : ''}`}
                    onClick={() => handleTabChange('unread')}
                  >
                    ยังไม่ได้อ่าน
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => handleTabChange('all')}
                  >
                    ทั้งหมด
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              <NotificationList 
                showRead={activeTab === 'all'}
                limit={50}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}