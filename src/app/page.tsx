'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      if (session.user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/tenant/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="text-center">
        <div className="mb-5">
          <h1 className="display-4 fw-bold mb-3" style={{ color: '#2c3e50' }}>
            Bill Mate
          </h1>
          <p className="lead text-muted mb-4">
            ระบบจัดการค่าเช่าหอพัก ค่าน้ำ ค่าไฟ และตรวจสอบการชำระเงิน
          </p>
        </div>

        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mb-5">
          <Link href="/login" className="btn btn-primary btn-lg px-4 fw-bold">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn btn-outline-secondary btn-lg px-4 fw-bold">
            สมัครสมาชิก
          </Link>
        </div>

        <div className="row mt-5 pt-5">
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className="bi bi-house-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="card-title mt-3">จัดการห้องพัก</h5>
                <p className="card-text text-muted">บันทึกข้อมูลห้องและผู้เช่า</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className="bi bi-receipt text-success" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="card-title mt-3">เรียกเก็บค่าใช้บริการ</h5>
                <p className="card-text text-muted">สร้างบิลและติดตามการชำระเงิน</p>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className="bi bi-qr-code text-info" style={{ fontSize: '2.5rem' }}></i>
                <h5 className="card-title mt-3">อ่านสลิปธนาคาร</h5>
                <p className="card-text text-muted">ยืนยันการชำระด้วย OCR และ QR Code</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}