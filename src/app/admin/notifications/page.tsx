'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import NotificationList from '@/app/components/NotificationList';
import StyledSelect from '@/app/components/StyledSelect';

interface NotificationFormData {
  userId?: string;
  type: 'paymentReminder' | 'paymentVerified' | 'paymentRejected' | 'overdue' | 'billGenerated' | 'maintenance' | 'general';
  title: string;
  message: string;
  sendEmail?: boolean;
  sendInApp?: boolean;
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'templates'>('list');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sending, setSending] = useState(false);

  const notificationForm = useForm<NotificationFormData>({
    defaultValues: {
      type: 'general',
      sendEmail: true,
      sendInApp: true,
    }
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (activeTab === 'create') {
      fetchUsers();
    }
  }, [status, session, router, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (data: NotificationFormData) => {
    setSending(true);
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('ส่งการแจ้งเตือนเรียบร้อยแล้ว');
        notificationForm.reset();
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(result.error || 'ไม่สามารถส่งการแจ้งเตือนได้');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSending(false);
    }
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

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>จัดการการแจ้งเตือน</h2>
          </div>

          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                  >
                    การแจ้งเตือนทั้งหมด
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                  >
                    สร้างการแจ้งเตือน
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                  >
                    เทมเพลตการแจ้งเตือน
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {/* List Tab */}
              {activeTab === 'list' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>การแจ้งเตือนทั้งหมด</h5>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      รีเฟรช
                    </button>
                  </div>
                  <NotificationList 
                    showRead={true}
                    limit={50}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              )}

              {/* Create Tab */}
              {activeTab === 'create' && (
                <div>
                  <h5 className="mb-4">สร้างการแจ้งเตือนใหม่</h5>
                  <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)}>
                    <div className="row">
                      <div className="col-md-6">
                        <StyledSelect
                          value={notificationForm.watch('userId') || ''}
                          onChange={(val) => notificationForm.setValue('userId', (val && String(val)) || undefined)}
                          label="ผู้รับ (ปล่อยว่างสำหรับทุกคน)"
                          options={[
                            { value: '', label: 'ทุกผู้ใช้' },
                            ...users.map((user) => ({
                              value: user._id,
                              label: `${user.name} (${user.email}) - ${user.role}`,
                            })),
                          ]}
                        />
                      </div>
                      <div className="col-md-6">
                        <StyledSelect
                          value={notificationForm.watch('type') || 'general'}
                          onChange={(val) => notificationForm.setValue('type', val as any)}
                          label="ประเภทการแจ้งเตือน"
                          options={[
                            { value: 'general', label: 'ทั่วไป' },
                            { value: 'paymentReminder', label: 'แจ้งเตือนการชำระเงิน' },
                            { value: 'paymentVerified', label: 'ยืนยันการชำระเงิน' },
                            { value: 'paymentRejected', label: 'ปฏิเสธการชำระเงิน' },
                            { value: 'overdue', label: 'เกินกำหนดชำระ' },
                            { value: 'billGenerated', label: 'สร้างบิล' },
                            { value: 'maintenance', label: 'ซ่อมบำรุง' },
                          ]}
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">หัวข้อ</label>
                      <input
                        type="text"
                        className="form-control"
                        {...notificationForm.register('title', { required: true })}
                      />
                      {notificationForm.formState.errors.title && (
                        <div className="text-danger small">
                          กรุณากรอกหัวข้อ
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">ข้อความ</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        {...notificationForm.register('message', { required: true })}
                      />
                      {notificationForm.formState.errors.message && (
                        <div className="text-danger small">
                          กรุณากรอกข้อความ
                        </div>
                      )}
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('sendEmail')}
                          />
                          <label className="form-check-label">
                            ส่งทางอีเมล
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('sendInApp')}
                          />
                          <label className="form-check-label">
                            ส่งในแอป
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={sending}
                      >
                        {sending ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            กำลังส่ง...
                          </>
                        ) : (
                          'ส่งการแจ้งเตือน'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>เทมเพลตการแจ้งเตือน</h5>
                    <a href="/admin/notifications/templates" className="btn btn-primary">
                      <i className="bi bi-gear me-1"></i>
                      จัดการเทมเพลต
                    </a>
                  </div>
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-file-earmark-text fs-1 d-block mb-2"></i>
                    <p>คลิกที่ปุ่ม "จัดการเทมเพลต" เพื่อดูและแก้ไขเทมเพลตการแจ้งเตือน</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}