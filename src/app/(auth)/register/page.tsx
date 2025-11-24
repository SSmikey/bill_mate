'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('กรุณากรอกข้อมูลที่จำเป็น');
      return false;
    }

    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('กรุณากรอกอีเมลที่ถูกต้อง');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || null,
          role: 'tenant',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        return;
      }

      // Auto login after registration
      try {
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push('/tenant/dashboard');
        } else {
          router.push('/login?message=registration-success');
        }
      } catch (signInError) {
        console.error('Sign in error after registration:', signInError);
        router.push('/login?message=registration-success');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5 col-xl-4">
            <div className="card shadow-lg border-0 rounded-4 fade-in">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="bg-gradient-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-person-plus fs-2"></i>
                  </div>
                  <h1 className="fw-bold text-gradient mb-2">Bill Mate</h1>
                  <p className="text-muted">สมัครสมาชิกเพื่อเริ่มใช้งาน</p>
                </div>

                <h5 className="text-center mb-4 fw-semibold">สมัครสมาชิกใหม่</h5>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div className="flex-grow-1">{error}</div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError('')}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-semibold">
                      <i className="bi bi-person me-2 text-muted"></i>
                      ชื่อ-นามสกุล
                    </label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      id="name"
                      name="name"
                      placeholder="เช่น สมชาย ใจดี"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <i className="bi bi-envelope me-2 text-muted"></i>
                      อีเมล
                    </label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      id="email"
                      name="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label fw-semibold">
                      <i className="bi bi-telephone me-2 text-muted"></i>
                      เบอร์โทรศัพท์ (ไม่บังคับ)
                    </label>
                    <input
                      type="tel"
                      className="form-control rounded-3"
                      id="phone"
                      name="phone"
                      placeholder="0812345678"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2 text-muted"></i>
                      รหัสผ่าน
                    </label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      ต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                    </small>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      <i className="bi bi-lock-fill me-2 text-muted"></i>
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 fw-semibold py-3 rounded-3 shadow-hover"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        กำลังสมัครสมาชิก...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        สมัครสมาชิก
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    มีบัญชีแล้ว?{' '}
                    <Link href="/login" className="fw-semibold text-link">
                      เข้าสู่ระบบ
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-white-50 small">
                <i className="bi bi-shield-check me-1"></i>
                ข้อมูลของคุณจะถูกเก็บเป็นความลับและปลอดภัย
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
