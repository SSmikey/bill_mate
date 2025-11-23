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
    <nav className="navbar navbar-expand-lg sticky-top shadow-sm">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <div className="bg-gradient-primary text-white rounded-circle p-2 me-2">
            <i className="bi bi-house-check"></i>
          </div>
          <span className="fw-bold text-gradient">Bill Mate</span>
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
              >
                <div className="bg-light rounded-circle p-2 me-2">
                  <i className="bi bi-person text-primary"></i>
                </div>
                <div className="text-start">
                  <div className="fw-semibold text-dark">{session.user?.name || 'ผู้ใช้'}</div>
                  <small className="text-muted">
                    {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                  </small>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" aria-labelledby="userDropdown" style={{ minWidth: '250px' }}>
                <li className="px-3 py-2 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="bg-light rounded-circle p-2 me-3">
                      <i className="bi bi-person text-primary"></i>
                    </div>
                    <div>
                      <div className="fw-semibold">{session.user?.name || 'ผู้ใช้'}</div>
                      <small className="text-muted">{session.user?.email}</small>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="px-3 py-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary">
                      {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                    </span>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link href={session.user?.role === 'admin' ? '/admin/profile' : '/tenant/profile'} className="dropdown-item d-flex align-items-center">
                    <i className="bi bi-gear me-3 text-muted"></i>
                    ตั้งค่าโปรไฟล์
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger d-flex align-items-center"
                    onClick={handleLogout}
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
