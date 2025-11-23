'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'tenant';
  roomId?: string;
  roomNumber?: string;
}

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Forms
  const profileForm = useForm<UserProfile>();
  const passwordForm = useForm<{ 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string;
  }>();
  const notificationForm = useForm<NotificationPreferences>();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      fetchPreferences();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        profileForm.reset(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      alert('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/profile/notifications');
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.data);
        notificationForm.reset(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleProfileSubmit = async (data: UserProfile) => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data);
        alert('อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      } else {
        alert(result.error || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (data: { 
    currentPassword: string; 
    newPassword: string; 
    confirmPassword: string;
  }) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (data.newPassword.length < 8) {
      alert('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
        passwordForm.reset();
      } else {
        alert(result.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (data: NotificationPreferences) => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        setPreferences(result.data);
        alert('อัปเดตการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว');
      } else {
        alert(result.error || 'ไม่สามารถอัปเดตการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Notification preferences update error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
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

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">เมนู</h5>
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="bi bi-person me-2"></i>
                  ข้อมูลส่วนตัว
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                >
                  <i className="bi bi-lock me-2"></i>
                  เปลี่ยนรหัสผ่าน
                </button>
                <button
                  className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="bi bi-bell me-2"></i>
                  การแจ้งเตือน
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">ข้อมูลส่วนตัว</h5>
              </div>
              <div className="card-body">
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">ชื่อ</label>
                      <input
                        type="text"
                        className="form-control"
                        {...profileForm.register('name', { required: true })}
                      />
                      {profileForm.formState.errors.name && (
                        <div className="text-danger small">
                          {profileForm.formState.errors.name.message}
                        </div>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">อีเมล</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profile?.email || ''}
                        disabled
                      />
                      <small className="text-muted">ไม่สามารถเปลี่ยนอีเมลได้</small>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">เบอร์โทรศัพท์</label>
                      <input
                        type="tel"
                        className="form-control"
                        {...profileForm.register('phone')}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">บทบาท</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile?.role || ''}
                        disabled
                      />
                    </div>
                  </div>
                  {profile?.roomNumber && (
                    <div className="mb-3">
                      <label className="form-label">ห้องพัก</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.roomNumber}
                        disabled
                      />
                    </div>
                  )}
                  <div className="d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          กำลังบันทึก...
                        </>
                      ) : (
                        'บันทึกข้อมูล'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">เปลี่ยนรหัสผ่าน</h5>
              </div>
              <div className="card-body">
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                  <div className="mb-3">
                    <label className="form-label">รหัสผ่านเดิม</label>
                    <input
                      type="password"
                      className="form-control"
                      {...passwordForm.register('currentPassword', { required: true })}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <div className="text-danger small">
                        {passwordForm.formState.errors.currentPassword.message}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">รหัสผ่านใหม่</label>
                    <input
                      type="password"
                      className="form-control"
                      {...passwordForm.register('newPassword', { 
                        required: true,
                        minLength: 8
                      })}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <div className="text-danger small">
                        {passwordForm.formState.errors.newPassword.message}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                    <input
                      type="password"
                      className="form-control"
                      {...passwordForm.register('confirmPassword', { required: true })}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <div className="text-danger small">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          กำลังเปลี่ยนรหัสผ่าน...
                        </>
                      ) : (
                        'เปลี่ยนรหัสผ่าน'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && preferences && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">การตั้งค่าการแจ้งเตือน</h5>
              </div>
              <div className="card-body">
                <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)}>
                  {/* Email Notifications */}
                  <div className="mb-4">
                    <h6>การแจ้งเตือนทางอีเมล</h6>
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        {...notificationForm.register('email.enabled')}
                      />
                      <label className="form-check-label">
                        เปิดใช้งานการแจ้งเตือนทางอีเมล
                      </label>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('email.paymentReminder')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนก่อนครบกำหนด
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('email.paymentVerified')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนเมื่อยืนยันการชำระเงิน
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('email.paymentRejected')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนเมื่อปฏิเสธการชำระเงิน
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('email.overdue')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนเมื่อเกินกำหนดชำระ
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="mb-4">
                    <h6>การแจ้งเตือนในแอป</h6>
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        {...notificationForm.register('inApp.enabled')}
                      />
                      <label className="form-check-label">
                        เปิดใช้งานการแจ้งเตือนในแอป
                      </label>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('inApp.paymentReminder')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนก่อนครบกำหนด
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('inApp.paymentVerified')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนเมื่อยืนยันการชำระเงิน
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('inApp.paymentRejected')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนเมื่อปฏิเสธการชำระเงิน
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            {...notificationForm.register('inApp.overdue')}
                          />
                          <label className="form-check-label">
                            แจ้งเตือนเมื่อเกินกำหนดชำระ
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div className="mb-4">
                    <h6>ช่วงเวลาเงียบ</h6>
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        {...notificationForm.register('quietHours.enabled')}
                      />
                      <label className="form-check-label">
                        เปิดใช้งานช่วงเวลาเงียบ
                      </label>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">เวลาเริ่มต้น</label>
                        <input
                          type="time"
                          className="form-control"
                          {...notificationForm.register('quietHours.startTime')}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">เวลาสิ้นสุด</label>
                        <input
                          type="time"
                          className="form-control"
                          {...notificationForm.register('quietHours.endTime')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          กำลังบันทึก...
                        </>
                      ) : (
                        'บันทึกการตั้งค่า'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}