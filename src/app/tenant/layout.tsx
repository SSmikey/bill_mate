import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import SidebarToggle from '@/app/components/SidebarToggle';
import SessionProvider from '@/app/components/SessionProvider';
import IconLoader from '@/app/components/IconLoader';
import ActiveNavLink from '@/app/components/ActiveNavLink';

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
        <SidebarToggle>
          <nav className="sidebar border-0 bg-white shadow-sm" style={{ width: '280px', overflowY: 'auto' }}>
          <div className="p-4">
            <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3 bg-gradient-primary text-white">
              <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-person-fill" style={{ fontSize: '1.2rem' }}></i>
              </div>
              <div>
                <div className="fw-semibold">{session?.user?.name}</div>
                <small className="opacity-75">ผู้เช่า</small>
              </div>
            </div>
          </div>

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">เมนูหลัก</h6>
          </div>

          <div className="nav flex-column px-2">
            <ActiveNavLink
              href="/tenant/dashboard"
              icon={<i className="bi bi-speedometer2"></i>}
              label="แดชบอร์ด"
            />

            <ActiveNavLink
              href="/tenant/bills"
              icon={<i className="bi bi-receipt"></i>}
              label="บิลของฉัน"
            />

            <ActiveNavLink
              href="/tenant/payments"
              icon={<i className="bi bi-credit-card"></i>}
              label="ประวัติการชำระ"
            />

            <ActiveNavLink
              href="/tenant/maintenance"
              icon={<i className="bi bi-tools"></i>}
              label="แจ้งซ่อมบำรุง"
            />
          </div>

          <hr className="mx-3 my-3" style={{ borderColor: '#f1f5f9' }} />

          <div className="px-4 mb-3">
            <h6 className="text-muted fw-semibold text-uppercase small">การตั้งค่า</h6>
          </div>

          <div className="nav flex-column px-2">
            <ActiveNavLink
              href="/tenant/profile"
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
                    ต้องการความช่วยเหลือ? ติดต่อผู้ดูแลระบบ
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
    </SessionProvider>
  );
}
