'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { data: session } = useSession();
  const [iconsLoaded, setIconsLoaded] = useState(true);

  useEffect(() => {
    // Bootstrap Icons should already be loaded from layout.tsx
    // Just ensure it's available
    setIconsLoaded(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // Don't hide navbar while loading, show placeholder
  if (!session) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg sticky-top bg-primary text-white shadow-sm">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
          <div className="bg-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-house-check" style={{ fontSize: '1.2rem' }}></i>
          </div>
          <span className="fw-bold">Bill Mate</span>
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
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {/* Notifications */}
            <li className="nav-item">
              <NotificationDropdown />
            </li>

            {/* User Menu */}
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle d-flex align-items-center gap-2 text-white"
                id="userDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="bg-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-person" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div className="text-start d-none d-md-block">
                  <div className="fw-semibold">{session.user?.name || 'ผู้ใช้'}</div>
                  <small className="opacity-75">
                    {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                  </small>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0" aria-labelledby="userDropdown">
                <li className="px-3 py-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary rounded-circle p-2 d-flex align-items-center justify-content-center text-white" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-person" style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">{session.user?.name || 'ผู้ใช้'}</div>
                      <small className="text-muted">{session.user?.email}</small>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="px-3 py-2">
                    <span className="badge bg-primary">
                      {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                    </span>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link
                    href={session.user?.role === 'admin' ? '/admin/profile' : '/tenant/profile'}
                    className="dropdown-item d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-gear" style={{ fontSize: '1.2rem' }}></i>
                    ตั้งค่าโปรไฟล์
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 text-danger"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right" style={{ fontSize: '1.2rem' }}></i>
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
