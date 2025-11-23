'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'registration-success') {
      setSuccessMessage('สมัครสมาชิกสำเร็จแล้ว กรุณาเข้าสู่ระบบ');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // Get session after successful login
        const sessionRes = await fetch('/api/auth/session');

        if (!sessionRes.ok) {
          setError('เกิดข้อผิดพลาดในการดึงข้อมูลเซสชัน');
          setLoading(false);
          return;
        }

        const session = await sessionRes.json();
        const userRole = session?.user?.role;

        if (userRole === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/tenant/dashboard');
        }
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5 col-xl-4">
            <div className="card shadow-xl border-0 fade-in" style={{ borderRadius: 'var(--radius-2xl)' }}>
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <div className="bg-gradient-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                    <i className="bi bi-house-check fs-2"></i>
                  </div>
                  <h1 className="fw-bold text-gradient mb-2">Bill Mate</h1>
                  <p className="text-muted">ระบบจัดการค่าเช่าหอพักที่ทันสมัย</p>
                </div>

                <h5 className="text-center mb-4 fw-semibold">เข้าสู่ระบบ</h5>

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

                {successMessage && (
                  <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <div className="flex-grow-1">{successMessage}</div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSuccessMessage('')}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <i className="bi bi-envelope me-2 text-muted"></i>
                      อีเมล
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      style={{ borderRadius: 'var(--radius-lg)' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2 text-muted"></i>
                      รหัสผ่าน
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      id="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      style={{ borderRadius: 'var(--radius-lg)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 fw-semibold shadow-hover"
                    disabled={loading}
                    style={{ borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        กำลังเข้าสู่ระบบ...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        เข้าสู่ระบบ
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    ยังไม่มีบัญชี?{' '}
                    <Link href="/register" className="fw-semibold text-link">
                      สมัครสมาชิก
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-white-50 small">
                <i className="bi bi-shield-check me-1"></i>
                ระบบจัดการค่าเช่าหอพักที่ปลอดภัยและเชื่อถือได้
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
