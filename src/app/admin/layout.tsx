import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import SidebarToggle from '@/app/components/SidebarToggle';
import ActiveNavLink from '@/app/components/ActiveNavLink';

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
        <SidebarToggle>
          <nav className="sidebar border-0 bg-white shadow-sm" style={{ width: '280px', overflowY: 'auto' }}>
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 bg-gradient-primary text-white">
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
            <ActiveNavLink
              href="/admin/dashboard"
              icon={<i className="bi bi-speedometer2"></i>}
              label="แดชบอร์ด"
            />
          </div>

          <hr className="mx-3 my-3" style={{ borderColor: '#f1f5f9' }} />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การจัดการ</h6>
          </div>

          <div className="nav flex-column px-2">
            <ActiveNavLink
              href="/admin/rooms"
              icon={<i className="bi bi-house"></i>}
              label="จัดการห้องพัก"
            />

            <ActiveNavLink
              href="/admin/users"
              icon={<i className="bi bi-people"></i>}
              label="จัดการผู้เช่า"
            />

            <ActiveNavLink
              href="/admin/bills"
              icon={<i className="bi bi-receipt"></i>}
              label="บิลค่าใช้บริการ"
            />

            <ActiveNavLink
              href="/admin/payments"
              icon={<i className="bi bi-check-circle"></i>}
              label="ยืนยันการชำระเงิน"
            />

            <ActiveNavLink
              href="/admin/rooms/maintenance"
              icon={<i className="bi bi-tools"></i>}
              label="จัดการการแจ้งซ่อม"
            />
          </div>

          <hr className="mx-3 my-3" style={{ borderColor: '#f1f5f9' }} />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">รายงาน</h6>
          </div>

          <div className="nav flex-column px-2">
            <ActiveNavLink
              href="/admin/rooms/stats"
              icon={<i className="bi bi-graph-up"></i>}
              label="สถิติห้องพัก"
            />
          </div>

          <hr className="mx-3 my-3" style={{ borderColor: '#f1f5f9' }} />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การตั้งค่า</h6>
          </div>

          <div className="nav flex-column px-2">
            <ActiveNavLink
              href="/admin/profile"
              icon={<i className="bi bi-person"></i>}
              label="โปรไฟล์"
            />
          </div>

          <div className="p-3 mt-auto">
            <div className="card border-0 bg-light rounded-3">
              <div className="card-body p-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle p-2 bg-primary bg-opacity-10">
                    <i className="bi bi-info-circle text-primary" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                  <small className="text-muted">
                    ศูนย์ช่วยเหลือ: 02-XXX-XXXX
                  </small>
                </div>
              </div>
            </div>
          </div>
          </nav>
        </SidebarToggle>

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
