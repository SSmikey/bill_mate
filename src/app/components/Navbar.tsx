'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';
import SidebarToggle from './SidebarToggle';

export default function Navbar() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // Don't hide navbar while loading, show placeholder
  if (!session) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg sticky-top bg-white shadow-sm border-bottom border-light">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <SidebarToggle>
            <div></div>
          </SidebarToggle>
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
            <div className="bg-gradient-primary rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-house-check" style={{ fontSize: '1.2rem' }}></i>
            </div>
            <span className="fw-bold text-dark">Bill Mate</span>
          </Link>
        </div>

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
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {/* Notifications */}
            <li className="nav-item">
              <NotificationDropdown />
            </li>

            {/* User Menu */}
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle d-flex align-items-center gap-2 text-dark border-0"
                id="userDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-person text-primary" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div className="text-start d-none d-md-block">
                  <div className="fw-semibold text-dark">{session.user?.name || 'ผู้ใช้'}</div>
                  <small className="text-muted">
                    {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                  </small>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3" aria-labelledby="userDropdown" style={{ minWidth: '280px' }}>
                <li className="px-3 py-3 border-bottom border-light">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-gradient-primary rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: '48px', height: '48px' }}>
                      <i className="bi bi-person" style={{ fontSize: '1.4rem' }}></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">{session.user?.name || 'ผู้ใช้'}</div>
                      <small className="text-muted">{session.user?.email}</small>
                    </div>
                  </div>
                </li>
                <li className="px-3 py-2">
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-2">
                    {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                  </span>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link
                    href={session.user?.role === 'admin' ? '/admin/profile' : '/tenant/profile'}
                    className="dropdown-item d-flex align-items-center gap-3 px-3 py-2 rounded-2"
                  >
                    <div className="rounded-circle p-2 bg-light">
                      <i className="bi bi-gear text-muted" style={{ fontSize: '1rem' }}></i>
                    </div>
                    <span>ตั้งค่าโปรไฟล์</span>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-3 px-3 py-2 rounded-2 text-danger"
                    onClick={handleLogout}
                  >
                    <div className="rounded-circle p-2 bg-light">
                      <i className="bi bi-box-arrow-right" style={{ fontSize: '1rem' }}></i>
                    </div>
                    <span>ออกจากระบบ</span>
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
