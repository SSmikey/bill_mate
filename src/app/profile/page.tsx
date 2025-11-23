// src/app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface NotificationPreferences {
  email: {
    enabled: boolean;
    paymentReminder: boolean;
    paymentVerified: boolean;
    paymentRejected: boolean;
    overdue: boolean;
    billGenerated: boolean;
  };
  inApp: {
    enabled: boolean;
    paymentReminder: boolean;
    paymentVerified: boolean;
    paymentRejected: boolean;
    overdue: boolean;
    billGenerated: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  idCard?: string;
  emergencyContact?: string;
  notificationPreferences?: NotificationPreferences;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      paymentReminder: true,
      paymentVerified: true,
      paymentRejected: true,
      overdue: true,
      billGenerated: true
    },
    inApp: {
      enabled: true,
      paymentReminder: true,
      paymentVerified: true,
      paymentRejected: true,
      overdue: true,
      billGenerated: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch profile
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        
        // ตั้งค่า notification preferences
        if (result.data.notificationPreferences) {
          setNotifPrefs(result.data.notificationPreferences);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }

  // Save notification preferences
  async function saveNotificationPreferences() {
    try {
      setSaving(true);

      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: notifPrefs })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ บันทึกการตั้งค่าสำเร็จ');
        await fetchProfile();
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  // Toggle channel (email/inApp)
  function toggleChannel(channel: 'email' | 'inApp', enabled: boolean) {
    setNotifPrefs(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled
      }
    }));
  }

  // Toggle notification type
  function toggleNotificationType(
    channel: 'email' | 'inApp',
    type: 'paymentReminder' | 'paymentVerified' | 'paymentRejected' | 'overdue' | 'billGenerated',
    enabled: boolean
  ) {
    setNotifPrefs(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: enabled
      }
    }));
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">ไม่สามารถโหลดข้อมูลได้</div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4">
        <i className="bi bi-person-circle"></i> โปรไฟล์ของฉัน
      </h2>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="bi bi-person"></i> ข้อมูลส่วนตัว
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <i className="bi bi-bell"></i> การแจ้งเตือน
          </button>
        </li>
      </ul>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">ชื่อ-นามสกุล</label>
                <input type="text" className="form-control" value={profile.name} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">อีเมล</label>
                <input type="email" className="form-control" value={profile.email} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">เบอร์โทร</label>
                <input type="text" className="form-control" value={profile.phone || '-'} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">เลขบัตรประชาชน</label>
                <input type="text" className="form-control" value={profile.idCard || '-'} disabled />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">ตั้งค่าการแจ้งเตือน</h5>
          </div>
          <div className="card-body">
            
            {/* Email Notifications */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <i className="bi bi-envelope"></i> การแจ้งเตือนทาง Email
                </h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailEnabled"
                    checked={notifPrefs.email.enabled}
                    onChange={(e) => toggleChannel('email', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="emailEnabled">
                    {notifPrefs.email.enabled ? 'เปิด' : 'ปิด'}
                  </label>
                </div>
              </div>

              {notifPrefs.email.enabled && (
                <div className="ms-4">
                  {[
                    { key: 'paymentReminder', label: '🔔 เตือนการชำระค่าเช่า', desc: 'แจ้งเตือนก่อนครบกำหนดชำระ' },
                    { key: 'paymentVerified', label: '✅ การชำระได้รับการอนุมัติ', desc: 'แจ้งเมื่อการชำระได้รับการอนุมัติ' },
                    { key: 'paymentRejected', label: '❌ การชำระถูกปฏิเสธ', desc: 'แจ้งเมื่อการชำระถูกปฏิเสธ' },
                    { key: 'overdue', label: '⚠️ เกินกำหนดชำระ', desc: 'แจ้งเมื่อค้างชำระเกินกำหนด' },
                    { key: 'billGenerated', label: '📄 บิลใหม่ออกแล้ว', desc: 'แจ้งเมื่อมีบิลใหม่' }
                  ].map(item => (
                    <div key={item.key} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`email-${item.key}`}
                        checked={notifPrefs.email[item.key as keyof typeof notifPrefs.email] as boolean}
                        onChange={(e) => toggleNotificationType('email', item.key as any, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`email-${item.key}`}>
                        <strong>{item.label}</strong>
                        <br />
                        <small className="text-muted">{item.desc}</small>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr />

            {/* In-App Notifications */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <i className="bi bi-bell-fill"></i> การแจ้งเตือนในแอป
                </h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="inAppEnabled"
                    checked={notifPrefs.inApp.enabled}
                    onChange={(e) => toggleChannel('inApp', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="inAppEnabled">
                    {notifPrefs.inApp.enabled ? 'เปิด' : 'ปิด'}
                  </label>
                </div>
              </div>

              {notifPrefs.inApp.enabled && (
                <div className="ms-4">
                  {[
                    { key: 'paymentReminder', label: '🔔 เตือนการชำระค่าเช่า' },
                    { key: 'paymentVerified', label: '✅ การชำระได้รับการอนุมัติ' },
                    { key: 'paymentRejected', label: '❌ การชำระถูกปฏิเสธ' },
                    { key: 'overdue', label: '⚠️ เกินกำหนดชำระ' },
                    { key: 'billGenerated', label: '📄 บิลใหม่ออกแล้ว' }
                  ].map(item => (
                    <div key={item.key} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`inApp-${item.key}`}
                        checked={notifPrefs.inApp[item.key as keyof typeof notifPrefs.inApp] as boolean}
                        onChange={(e) => toggleNotificationType('inApp', item.key as any, e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor={`inApp-${item.key}`}>
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr />

            {/* Quiet Hours */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <i className="bi bi-moon"></i> ช่วงเวลาไม่รับการแจ้งเตือน (Quiet Hours)
                </h6>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="quietHoursEnabled"
                    checked={notifPrefs.quietHours.enabled}
                    onChange={(e) => setNotifPrefs(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: e.target.checked }
                    }))}
                  />
                  <label className="form-check-label" htmlFor="quietHoursEnabled">
                    {notifPrefs.quietHours.enabled ? 'เปิด' : 'ปิด'}
                  </label>
                </div>
              </div>

              {notifPrefs.quietHours.enabled && (
                <div className="ms-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">เวลาเริ่มต้น</label>
                      <input
                        type="time"
                        className="form-control"
                        value={notifPrefs.quietHours.startTime}
                        onChange={(e) => setNotifPrefs(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, startTime: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">เวลาสิ้นสุด</label>
                      <input
                        type="time"
                        className="form-control"
                        value={notifPrefs.quietHours.endTime}
                        onChange={(e) => setNotifPrefs(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, endTime: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <small className="text-muted">
                    <i className="bi bi-info-circle"></i> จะไม่ส่ง email ในช่วงเวลานี้ (ใช้กับ email เท่านั้น)
                  </small>
                </div>
              )}
            </div>

          </div>
          <div className="card-footer">
            <button
              className="btn btn-success"
              onClick={saveNotificationPreferences}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> บันทึกการตั้งค่า
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}