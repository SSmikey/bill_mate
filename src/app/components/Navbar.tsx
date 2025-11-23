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
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand fw-bold">
          <i className="bi bi-house-check me-2"></i>
          Bill Mate
        </Link>

        <button
          className="navbar-toggler"
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
          <ul className="navbar-nav ms-auto">
            {/* Notifications */}
            <li className="nav-item me-3">
              <NotificationDropdown />
            </li>

            {/* User Menu */}
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle"
                id="userDropdown"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ color: 'white' }}
              >
                <i className="bi bi-person-circle me-2"></i>
                {session.user?.name || 'ผู้ใช้'}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <div className="dropdown-item disabled">
                    <small className="text-muted">{session.user?.email}</small>
                  </div>
                </li>
                <li>
                  <div className="dropdown-item disabled">
                    <small className="text-muted">
                      บทบาท:{' '}
                      <span className="badge bg-info">
                        {session.user?.role === 'admin' ? 'เจ้าของหอ' : 'ผู้เช่า'}
                      </span>
                    </small>
                  </div>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link href={session.user?.role === 'admin' ? '/admin/profile' : '/tenant/profile'} className="dropdown-item">
                    <i className="bi bi-gear me-2"></i>
                    ตั้งค่าโปรไฟล์
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
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
