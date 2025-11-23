import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is admin
  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  return (
    <>
      <Navbar />
      <div className="d-flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
        {/* Sidebar */}
        <nav className="sidebar bg-white border-end" style={{ width: '280px', overflowY: 'auto' }}>
          <div className="p-4">
            <div className="d-flex align-items-center mb-4">
              <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                <i className="bi bi-shield-check text-success"></i>
              </div>
              <div>
                <div className="fw-semibold">{session?.user?.name}</div>
                <small className="text-muted">เจ้าของหอ</small>
              </div>
            </div>
          </div>

          <div className="px-3 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">ภาพรวม</h6>
          </div>

          <div className="nav flex-column px-3">
            <Link
              href="/admin/dashboard"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-speedometer2 me-3"></i>
              <span>แดชบอร์ด</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-3 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การจัดการ</h6>
          </div>

          <div className="nav flex-column px-3">
            <Link
              href="/admin/rooms"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-house me-3"></i>
              <span>จัดการห้องพัก</span>
            </Link>

            <Link
              href="/admin/users"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-people me-3"></i>
              <span>จัดการผู้เช่า</span>
            </Link>

            <Link
              href="/admin/bills"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-receipt me-3"></i>
              <span>บิลค่าใช้บริการ</span>
            </Link>

            <Link
              href="/admin/payments"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-check-circle me-3"></i>
              <span>ยืนยันการชำระเงิน</span>
            </Link>

            <Link
              href="/admin/rooms/maintenance"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-tools me-3"></i>
              <span>จัดการการแจ้งซ่อม</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-3 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">รายงาน</h6>
          </div>

          <div className="nav flex-column px-3">
            <Link
              href="/admin/rooms/stats"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-graph-up me-3"></i>
              <span>สถิติห้องพัก</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-3 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การตั้งค่า</h6>
          </div>

          <div className="nav flex-column px-3">
            <Link
              href="/admin/profile"
              className="nav-link d-flex align-items-center px-3 py-3 mb-1 rounded-lg"
            >
              <i className="bi bi-person me-3"></i>
              <span>โปรไฟล์</span>
            </Link>
          </div>

          <div className="p-3 mt-auto">
            <div className="card bg-light border-0">
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <i className="bi bi-info-circle text-primary me-2"></i>
                  <small className="text-muted">
                    ศูนย์ช่วยเหลือ: 02-XXX-XXXX
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
    </>
  );
}
