'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'tenant';
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  reminder5Days: boolean;
  reminder1Day: boolean;
  overdueNotifications: boolean;
}

export default function TenantProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    role: 'tenant'
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    reminder5Days: true,
    reminder1Day: true,
    overdueNotifications: true
  });

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: (session.user as any).phone || '',
        role: session.user.role as 'admin' | 'tenant'
      });
    }
  }, [session]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถอัปเดตข้อมูลได้');
      }

      await update({
        ...session,
        user: {
          ...session?.user,
          name: profile.name,
          phone: profile.phone
        }
      });

      setSuccess('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setPasswordLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }

      setSuccess('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNotificationPrefsUpdate = async () => {
    setPrefsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/profile/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPrefs),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถอัปเดตการตั้งค่าได้');
      }

      setSuccess('อัปเดตการตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPrefsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-80">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <h5 className="text-muted">กำลังโหลดข้อมูล...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">โปรไฟล์ของฉัน</h1>
        <p className="text-muted mb-0">จัดการข้อมูลส่วนตัว รหัสผ่าน และการแจ้งเตือน</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Profile Information */}
      <div className="card border-0 bg-white rounded-3 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <h6 className="mb-0 fw-semibold text-dark">
            <i className="bi bi-person me-2 text-primary"></i>
            ข้อมูลส่วนตัว
          </h6>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleProfileUpdate}>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  className="form-control rounded-2"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">อีเมล</label>
                <input
                  type="email"
                  className="form-control rounded-2"
                  value={profile.email}
                  disabled
                  readOnly
                />
                <small className="text-muted">ไม่สามารถเปลี่ยนอีเมลได้</small>
              </div>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  className="form-control rounded-2"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">บทบาท</label>
                <input
                  type="text"
                  className="form-control rounded-2"
                  value={profile.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                  disabled
                  readOnly
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary rounded-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-2"></i>
                  บันทึก
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Password Change */}
      <div className="card border-0 bg-white rounded-3 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <h6 className="mb-0 fw-semibold text-dark">
            <i className="bi bi-shield-lock me-2 text-primary"></i>
            เปลี่ยนรหัสผ่าน
          </h6>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handlePasswordChange}>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold">รหัสผ่านเดิม</label>
                <input
                  type="password"
                  className="form-control rounded-2"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  disabled={passwordLoading}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  className="form-control rounded-2"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  disabled={passwordLoading}
                  required
                  minLength={6}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">ยืนยันรหัสผ่าน</label>
                <input
                  type="password"
                  className="form-control rounded-2"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  disabled={passwordLoading}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-warning rounded-2"
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  กำลังเปลี่ยน...
                </>
              ) : (
                <>
                  <i className="bi bi-key me-2"></i>
                  เปลี่ยนรหัสผ่าน
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card border-0 bg-white rounded-3 shadow-sm">
        <div className="card-header bg-white border-bottom p-4 rounded-top-3">
          <h6 className="mb-0 fw-semibold text-dark">
            <i className="bi bi-bell me-2 text-primary"></i>
            การแจ้งเตือน
          </h6>
        </div>
        <div className="card-body p-4">
          <form>
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emailNotifications"
                  checked={notificationPrefs.emailNotifications}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                  disabled={prefsLoading}
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  รับการแจ้งเตือนทางอีเมล
                </label>
              </div>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="reminder5Days"
                  checked={notificationPrefs.reminder5Days}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, reminder5Days: e.target.checked })}
                  disabled={prefsLoading}
                />
                <label className="form-check-label" htmlFor="reminder5Days">
                  แจ้งเตือนก่อนครบกำหนด 5 วัน
                </label>
              </div>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="reminder1Day"
                  checked={notificationPrefs.reminder1Day}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, reminder1Day: e.target.checked })}
                  disabled={prefsLoading}
                />
                <label className="form-check-label" htmlFor="reminder1Day">
                  แจ้งเตือนก่อนครบกำหนด 1 วัน
                </label>
              </div>
            </div>
            <div className="mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="overdueNotifications"
                  checked={notificationPrefs.overdueNotifications}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, overdueNotifications: e.target.checked })}
                  disabled={prefsLoading}
                />
                <label className="form-check-label" htmlFor="overdueNotifications">
                  แจ้งเตือนเมื่อเกินกำหนด
                </label>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-info rounded-2"
              onClick={handleNotificationPrefsUpdate}
              disabled={prefsLoading}
            >
              {prefsLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <i className="bi bi-gear me-2"></i>
                  บันทึกการตั้งค่า
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}