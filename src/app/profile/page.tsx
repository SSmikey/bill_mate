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

export default function ProfilePage() {
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
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h2 className="mb-4">
            <i className="bi bi-person-circle me-2"></i>
            โปรไฟล์ของฉัน
          </h2>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* ข้อมูลส่วนตัว */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-person me-2"></i>
                ข้อมูลส่วนตัว
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleProfileUpdate}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Label>ชื่อ-นามสกุล</Form.Label>
                    <Form.Control
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label>อีเมล</Form.Label>
                    <Form.Control
                      type="email"
                      value={profile.email}
                      disabled
                      readOnly
                    />
                    <Form.Text className="text-muted">ไม่สามารถเปลี่ยนอีเมลได้</Form.Text>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Label>เบอร์โทรศัพท์</Form.Label>
                    <Form.Control
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label>บทบาท</Form.Label>
                    <Form.Control
                      type="text"
                      value={profile.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save me-2"></i>
                      บันทึก
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* เปลี่ยนรหัสผ่าน */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-shield-lock me-2"></i>
                เปลี่ยนรหัสผ่าน
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handlePasswordChange}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <Form.Label>รหัสผ่านเดิม</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      disabled={passwordLoading}
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <Form.Label>รหัสผ่านใหม่</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      disabled={passwordLoading}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <Form.Label>ยืนยันรหัสผ่าน</Form.Label>
                    <Form.Control
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      disabled={passwordLoading}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="warning"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังเปลี่ยน...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-key me-2"></i>
                      เปลี่ยนรหัสผ่าน
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* การแจ้งเตือน */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-bell me-2"></i>
                การแจ้งเตือน
              </h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <div className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="emailNotifications"
                    label="รับการแจ้งเตือนทางอีเมล"
                    checked={notificationPrefs.emailNotifications}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                    disabled={prefsLoading}
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
                  />
                </div>
                <div className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="reminder1Day"
                    label="แจ้งเตือนก่อนครบกำหนด 1 วัน"
                    checked={notificationPrefs.reminder1Day}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, reminder1Day: e.target.checked })}
                    disabled={prefsLoading}
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
                  />
                </div>
                <Button
                  variant="info"
                  onClick={handleNotificationPrefsUpdate}
                  disabled={prefsLoading}
                >
                  {prefsLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-gear me-2"></i>
                      บันทึกการตั้งค่า
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}