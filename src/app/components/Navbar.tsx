'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  if (!session) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg sticky-top shadow-sm" style={{ backgroundColor: '#ffffff', zIndex: 1030 }}>
      <div className="container-fluid">
        <Link href="/" className="navbar-brand d-flex align-items-center" style={{ color: '#4361ee' }}>
          <div className="bg-gradient-primary text-white rounded-circle p-2 me-2">
            <i className="bi bi-house-check"></i>
          </div>
          <span className="fw-bold" style={{ background: 'linear-gradient(135deg, #4361ee, #7209b7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Bill Mate</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {/* Notifications */}
            <li className="nav-item me-2">
              <NotificationDropdown />
            </li>

            {/* User Menu */}
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle d-flex align-items-center"
                id="userDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ color: '#334155', textDecoration: 'none' }}
              >
                <div className="bg-light rounded-circle p-2 me-2" style={{ backgroundColor: '#f1f5f9' }}>
                  <i className="bi bi-person" style={{ color: '#4361ee' }}></i>
                </div>
                <div className="text-start">
                  <div className="fw-semibold" style={{ color: '#0f172a' }}>{session.user?.name || 'ผู้ใช้'}</div>
                  <small style={{ color: '#64748b' }}>
                    {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                  </small>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" aria-labelledby="userDropdown" style={{ minWidth: '250px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <li className="px-3 py-2 border-bottom" style={{ borderColor: '#e2e8f0' }}>
                  <div className="d-flex align-items-center">
                    <div className="bg-light rounded-circle p-2 me-3" style={{ backgroundColor: '#f1f5f9' }}>
                      <i className="bi bi-person" style={{ color: '#4361ee' }}></i>
                    </div>
                    <div>
                      <div className="fw-semibold" style={{ color: '#0f172a' }}>{session.user?.name || 'ผู้ใช้'}</div>
                      <small style={{ color: '#64748b' }}>{session.user?.email}</small>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="px-3 py-2">
                    <span className="badge" style={{ backgroundColor: 'rgba(67, 97, 238, 0.1)', color: '#4361ee' }}>
                      {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                    </span>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" style={{ borderColor: '#e2e8f0' }} />
                </li>
                <li>
                  <Link href={session.user?.role === 'admin' ? '/admin/profile' : '/tenant/profile'} className="dropdown-item d-flex align-items-center" style={{ color: '#334155' }}>
                    <i className="bi bi-gear me-3" style={{ color: '#64748b' }}></i>
                    ตั้งค่าโปรไฟล์
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" style={{ borderColor: '#e2e8f0' }} />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger d-flex align-items-center"
                    onClick={handleLogout}
                    style={{ color: '#ef4444' }}
                  >
                    <i className="bi bi-box-arrow-right me-3"></i>
                    ออกจากระบบ
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
