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
      <div className="d-flex" style={{ minHeight: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <nav
          className="bg-light border-end"
          style={{ width: '250px', overflowY: 'auto', padding: '20px 0' }}
        >
          <div className="px-3 mb-4">
            <h6 className="text-muted fw-bold text-uppercase">เจ้าของหอ</h6>
          </div>

          <div className="nav flex-column">
            <Link
              href="/admin/dashboard"
              className="nav-link text-dark d-flex align-items-center px-3 py-2 mb-2"
            >
              <i className="bi bi-speedometer2 me-3"></i>
              แดชบอร์ด
            </Link>

            <Link
              href="/admin/rooms"
              className="nav-link text-dark d-flex align-items-center px-3 py-2 mb-2"
            >
              <i className="bi bi-house me-3"></i>
              จัดการห้องพัก
            </Link>

            <Link
              href="/admin/users"
              className="nav-link text-dark d-flex align-items-center px-3 py-2 mb-2"
            >
              <i className="bi bi-people me-3"></i>
              จัดการผู้เช่า
            </Link>

            <Link
              href="/admin/bills"
              className="nav-link text-dark d-flex align-items-center px-3 py-2 mb-2"
            >
              <i className="bi bi-receipt me-3"></i>
              บิลค่าใช้บริการ
            </Link>

            <Link
              href="/admin/payments"
              className="nav-link text-dark d-flex align-items-center px-3 py-2 mb-2"
            >
              <i className="bi bi-check-circle me-3"></i>
              ยืนยันการชำระเงิน
            </Link>
          </div>

          <hr className="mx-3" />

          <div className="px-3 mb-4">
            <h6 className="text-muted fw-bold text-uppercase">อื่นๆ</h6>
          </div>

          <div className="nav flex-column">
            <Link
              href="/admin/profile"
              className="nav-link text-dark d-flex align-items-center px-3 py-2 mb-2"
            >
              <i className="bi bi-person me-3"></i>
              โปรไฟล์
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </>
  );
}
