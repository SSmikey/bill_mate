import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import IconLoader from '@/app/components/IconLoader';

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
      <IconLoader />
      <Navbar />
      <div className="d-flex" style={{ minHeight: 'calc(100vh - 70px)' }}>
        {/* Sidebar */}
        <nav className="sidebar border-end" style={{ width: '280px', overflowY: 'auto' }}>
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded bg-gradient-primary text-white">
              <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-shield-check" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <div className="fw-semibold">{session?.user?.name}</div>
                <small className="opacity-75">เจ้าของหอ</small>
              </div>
            </div>
          </div>

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">ภาพรวม</h6>
          </div>

          <div className="nav flex-column px-2">
            <Link
              href="/admin/dashboard"
              className="nav-link active d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-speedometer2" style={{ fontSize: '1.2rem' }}></i>
              <span>แดชบอร์ด</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การจัดการ</h6>
          </div>

          <div className="nav flex-column px-2">
            <Link
              href="/admin/rooms"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-house" style={{ fontSize: '1.2rem' }}></i>
              <span>จัดการห้องพัก</span>
            </Link>

            <Link
              href="/admin/users"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-people" style={{ fontSize: '1.2rem' }}></i>
              <span>จัดการผู้เช่า</span>
            </Link>

            <Link
              href="/admin/bills"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-receipt" style={{ fontSize: '1.2rem' }}></i>
              <span>บิลค่าใช้บริการ</span>
            </Link>

            <Link
              href="/admin/payments"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-check-circle" style={{ fontSize: '1.2rem' }}></i>
              <span>ยืนยันการชำระเงิน</span>
            </Link>

            <Link
              href="/admin/rooms/maintenance"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-tools" style={{ fontSize: '1.2rem' }}></i>
              <span>จัดการการแจ้งซ่อม</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">รายงาน</h6>
          </div>

          <div className="nav flex-column px-2">
            <Link
              href="/admin/rooms/stats"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-graph-up" style={{ fontSize: '1.2rem' }}></i>
              <span>สถิติห้องพัก</span>
            </Link>
          </div>

          <hr className="mx-3 my-3" />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การตั้งค่า</h6>
          </div>

          <div className="nav flex-column px-2">
            <Link
              href="/admin/profile"
              className="nav-link d-flex align-items-center gap-3 px-3 py-2 mb-1 rounded"
            >
              <i className="bi bi-person" style={{ fontSize: '1.2rem' }}></i>
              <span>โปรไฟล์</span>
            </Link>
          </div>

          <div className="p-3 mt-auto">
            <div className="card border-0 bg-light">
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle text-primary" style={{ fontSize: '1.2rem' }}></i>
                  <small className="text-muted">
                    ศูนย์ช่วยเหลือ: 02-XXX-XXXX
                  </small>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow-1 p-4" style={{ overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          <div className="container-lg">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
