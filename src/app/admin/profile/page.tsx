'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';

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

export default function AdminProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    role: 'admin'
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

      // Update session
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
      <div className="text-center p-5">
        <Spinner animation="border" />
        <p className="mt-3">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">โปรไฟล์ของฉัน</h1>
        <p className="text-muted mb-0">จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-4">
          {success}
        </Alert>
      )}

      {/* ข้อมูลส่วนตัว */}
      <div className="row mb-4 g-3">
        <div className="col-12">
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
                  <i className="bi bi-person-fill fs-5 text-primary"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">ข้อมูลส่วนตัว</h6>
                  <p className="mb-0 small text-muted">จัดการข้อมูลพื้นฐานของคุณ</p>
                </div>
              </div>
              <Form onSubmit={handleProfileUpdate}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-medium text-dark">ชื่อ-นามสกุล</Form.Label>
                    <Form.Control
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={loading}
                      required
                      className="rounded-2 bg-white"
                      style={{ color: '#000' }}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-medium text-dark">อีเมล</Form.Label>
                    <Form.Control
                      type="email"
                      value={profile.email}
                      disabled
                      readOnly
                      className="rounded-2 bg-light"
                      style={{ color: '#000' }}
                    />
                    <Form.Text className="text-muted">ไม่สามารถเปลี่ยนอีเมลได้</Form.Text>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-medium text-dark">เบอร์โทรศัพท์</Form.Label>
                    <Form.Control
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={loading}
                      className="rounded-2 bg-white"
                      style={{ color: '#000' }}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-medium text-dark">บทบาท</Form.Label>
                    <Form.Control
                      type="text"
                      value={profile.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                      disabled
                      readOnly
                      className="rounded-2 bg-light"
                      style={{ color: '#000' }}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="rounded-2 px-4 py-2"
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      บันทึกข้อมูล
                    </>
                  )}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* เปลี่ยนรหัสผ่าน */}
      <div className="row mb-4 g-3">
        <div className="col-12">
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-warning bg-opacity-10">
                  <i className="bi bi-shield-lock-fill fs-5 text-warning"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">เปลี่ยนรหัสผ่าน</h6>
                  <p className="mb-0 small text-muted">อัปเดตรหัสผ่านเพื่อความปลอดภัย</p>
                </div>
              </div>
              <Form onSubmit={handlePasswordChange}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <Form.Label className="fw-medium text-dark">รหัสผ่านเดิม</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      disabled={passwordLoading}
                      required
                      className="rounded-2 bg-white"
                      style={{ color: '#000' }}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <Form.Label className="fw-medium text-dark">รหัสผ่านใหม่</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      disabled={passwordLoading}
                      required
                      minLength={6}
                      className="rounded-2 bg-white"
                      style={{ color: '#000' }}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <Form.Label className="fw-medium text-dark">ยืนยันรหัสผ่าน</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      disabled={passwordLoading}
                      required
                      minLength={6}
                      className="rounded-2 bg-white"
                      style={{ color: '#000' }}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="warning"
                  disabled={passwordLoading}
                  className="rounded-2 px-4 py-2"
                >
                  {passwordLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังเปลี่ยน...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-key-fill me-2"></i>
                      เปลี่ยนรหัสผ่าน
                    </>
                  )}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {/* การแจ้งเตือน */}
      <div className="row g-3">
        <div className="col-12">
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-info bg-opacity-10">
                  <i className="bi bi-bell-fill fs-5 text-info"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">การแจ้งเตือน</h6>
                  <p className="mb-0 small text-muted">จัดการการตั้งค่าการแจ้งเตือน</p>
                </div>
              </div>
              <Form>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="emailNotifications"
                        label="รับการแจ้งเตือนทางอีเมล"
                        checked={notificationPrefs.emailNotifications}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                        disabled={prefsLoading}
                        className="form-check-lg"
                      />
                    </div>
                    <div className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="reminder5Days"
                        label="แจ้งเตือนก่อนครบกำหนด 5 วัน"
                        checked={notificationPrefs.reminder5Days}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, reminder5Days: e.target.checked })}
                        disabled={prefsLoading}
                        className="form-check-lg"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="reminder1Day"
                        label="แจ้งเตือนก่อนครบกำหนด 1 วัน"
                        checked={notificationPrefs.reminder1Day}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, reminder1Day: e.target.checked })}
                        disabled={prefsLoading}
                        className="form-check-lg"
                      />
                    </div>
                    <div className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="overdueNotifications"
                        label="แจ้งเตือนเมื่อเกินกำหนด"
                        checked={notificationPrefs.overdueNotifications}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, overdueNotifications: e.target.checked })}
                        disabled={prefsLoading}
                        className="form-check-lg"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="info"
                  onClick={handleNotificationPrefsUpdate}
                  disabled={prefsLoading}
                  className="rounded-2 px-4 py-2"
                >
                  {prefsLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-gear-fill me-2"></i>
                      บันทึกการตั้งค่า
                    </>
                  )}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}