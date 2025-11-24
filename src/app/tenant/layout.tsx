import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import SessionProvider from '@/app/components/SessionProvider';
import IconLoader from '@/app/components/IconLoader';

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider session={session}>
      <IconLoader />
      <Navbar />
      <div className="d-flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
        {/* Sidebar */}
        <nav className="sidebar bg-white border-end" style={{ width: '280px', overflowY: 'auto' }}>
          <div className="p-4">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-person-fill text-primary" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <div className="fw-semibold">{session?.user?.name}</div>
                <small className="text-muted">ผู้เช่า</small>
              </div>
            </div>
          </div>

          <div className="px-3 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">เมนูหลัก</h6>
          </div>

          <div className="nav flex-column px-3">
            <Link
              href="/tenant/dashboard"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-speedometer2 me-3" style={{ fontSize: '1.2rem' }}></i>
              <span>แดชบอร์ด</span>
            </Link>

            <Link
              href="/tenant/bills"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-receipt me-3" style={{ fontSize: '1.2rem' }}></i>
              <span>บิลของฉัน</span>
            </Link>

            <Link
              href="/tenant/payments"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-credit-card me-3" style={{ fontSize: '1.2rem' }}></i>
              <span>ประวัติการชำระ</span>
            </Link>

            <Link
              href="/tenant/maintenance"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-tools me-3" style={{ fontSize: '1.2rem' }}></i>
              <span>แจ้งซ่อมบำรุง</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-3 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การตั้งค่า</h6>
          </div>

          <div className="nav flex-column px-3">
            <Link
              href="/tenant/profile"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-person me-3" style={{ fontSize: '1.2rem' }}></i>
              <span>โปรไฟล์</span>
            </Link>
          </div>

          <div className="p-3 mt-auto">
            <div className="card bg-light border-0">
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                  <small className="text-muted">
                    ต้องการความช่วยเหลือ? ติดต่อผู้ดูแลระบบ
                  </small>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow-1 p-4" style={{ backgroundColor: 'var(--gray-50)', overflowY: 'auto' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionProvider>
  );
}
