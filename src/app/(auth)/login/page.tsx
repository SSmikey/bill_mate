'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Redirect based on user role
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session?.user?.role === 'admin') {
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
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="col-md-5 col-lg-4">
        <div className="card shadow-lg border-0" style={{ borderRadius: '10px' }}>
          <div className="card-body p-5">
            <h1 className="text-center mb-4 fw-bold" style={{ color: '#2c3e50' }}>
              Bill Mate
            </h1>
            <h5 className="text-center mb-4 text-muted">เข้าสู่ระบบ</h5>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
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
                <label htmlFor="email" className="form-label fw-bold">
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
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-bold">
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
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 fw-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </form>

            <hr className="my-4" />

            <div className="text-center">
              <p className="text-muted mb-0">
                ยังไม่มีบัญชี?{' '}
                <Link href="/register" className="fw-bold text-primary text-decoration-none">
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-muted small">
          <p>ระบบจัดการค่าเช่าหอพัก</p>
        </div>
      </div>
    </div>
  );
}
