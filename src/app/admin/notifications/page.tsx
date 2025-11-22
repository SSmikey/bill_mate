// src/app/admin/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Stats {
  overview: {
    sentToday: number;
    sentThisWeek: number;
    unread: number;
    totalRead: number;
    totalNotifications: number;
    readRate: number;
  };
  byType: {
    payment_reminder: number;
    payment_verified: number;
    payment_rejected: number;
    overdue: number;
    bill_generated: number;
  };
  cronJobs: Array<{
    name: string;
    schedule: string;
    nextRun: string;
    status: string;
  }>;
  recentLogs: Array<{
    id: string;
    type: string;
    sentAt: string;
    read: boolean;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/tenant/dashboard');
    }
  }, [status, session, router]);

  // Fetch stats
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchStats();
    }
  }, [status, session]);

  async function fetchStats() {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert('เกิดข้อผิดพลาดในการโหลดสถิติ');
    } finally {
      setLoading(false);
    }
  }

  // Manual trigger
  async function triggerNotification(type: string) {
    if (!confirm(`ต้องการส่งการแจ้งเตือนประเภท "${getTypeName(type)}" หรือไม่?`)) {
      return;
    }

    try {
      setTriggering(type);
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ส่งการแจ้งเตือนสำเร็จ ${result.data.notificationCount} รายการ`);
        await fetchStats();
      } else {
        alert(`❌ ${result.error || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (error) {
      console.error('Error triggering notification:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setTriggering(null);
    }
  }

  function getTypeName(type: string): string {
    switch (type) {
      case 'reminder_5days': return 'เตือนก่อนครบกำหนด 5 วัน';
      case 'reminder_1day': return 'เตือนก่อนครบกำหนด 1 วัน';
      case 'overdue': return 'เกินกำหนดชำระ';
      default: return type;
    }
  }

  function getTypeIcon(type: string): string {
    switch (type) {
      case 'payment_reminder': return '🔔';
      case 'payment_verified': return '✅';
      case 'payment_rejected': return '❌';
      case 'overdue': return '⚠️';
      case 'bill_generated': return '📄';
      default: return '📌';
    }
  }

  function getStatusBadge(status: string) {
    return status === 'active' ? (
      <span className="badge bg-success">🟢 Active</span>
    ) : (
      <span className="badge bg-secondary">⚫ Inactive</span>
    );
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">ไม่สามารถโหลดข้อมูลได้</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 mb-5">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="bi bi-bell-fill"></i> จัดการการแจ้งเตือน
            </h2>
            <button
              className="btn btn-outline-primary"
              onClick={fetchStats}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i> รีเฟรช
            </button>
          </div>

          {/* Statistics Overview */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h6 className="card-title">ส่งวันนี้</h6>
                  <h2 className="mb-0">{stats.overview.sentToday}</h2>
                  <small>รายการ</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <h6 className="card-title">ยังไม่อ่าน</h6>
                  <h2 className="mb-0">{stats.overview.unread}</h2>
                  <small>รายการ</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h6 className="card-title">อัตราการอ่าน</h6>
                  <h2 className="mb-0">{stats.overview.readRate}%</h2>
                  <small>ของทั้งหมด</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h6 className="card-title">ส่งสัปดาห์นี้</h6>
                  <h2 className="mb-0">{stats.overview.sentThisWeek}</h2>
                  <small>รายการ</small>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications by Type */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">การแจ้งเตือนแยกตามประเภท</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-2">
                  <div className="mb-2">
                    <h3>🔔</h3>
                    <h4>{stats.byType.payment_reminder}</h4>
                    <small>เตือนการชำระ</small>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="mb-2">
                    <h3>✅</h3>
                    <h4>{stats.byType.payment_verified}</h4>
                    <small>อนุมัติแล้ว</small>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="mb-2">
                    <h3>❌</h3>
                    <h4>{stats.byType.payment_rejected}</h4>
                    <small>ปฏิเสธ</small>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="mb-2">
                    <h3>⚠️</h3>
                    <h4>{stats.byType.overdue}</h4>
                    <small>เกินกำหนด</small>
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="mb-2">
                    <h3>📄</h3>
                    <h4>{stats.byType.bill_generated}</h4>
                    <small>สร้างบิลใหม่</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Triggers */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">ส่งการแจ้งเตือนด้วยตนเอง</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-3 flex-wrap">
                <button
                  className="btn btn-warning"
                  onClick={() => triggerNotification('reminder_5days')}
                  disabled={triggering !== null}
                >
                  {triggering === 'reminder_5days' ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-bell me-2"></i>
                  )}
                  ส่งเตือน 5 วัน
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => triggerNotification('reminder_1day')}
                  disabled={triggering !== null}
                >
                  {triggering === 'reminder_1day' ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-bell me-2"></i>
                  )}
                  ส่งเตือน 1 วัน
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => triggerNotification('overdue')}
                  disabled={triggering !== null}
                >
                  {triggering === 'overdue' ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-exclamation-triangle me-2"></i>
                  )}
                  ส่งแจ้งเกินกำหนด
                </button>
              </div>
              <div className="alert alert-info mt-3 mb-0">
                <i className="bi bi-info-circle"></i> ปุ่มเหล่านี้จะส่งการแจ้งเตือนทันทีไปยังผู้ใช้ที่ตรงตามเงื่อนไข
              </div>
            </div>
          </div>

          <div className="row">
            {/* Cron Job Status */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header bg-light">
                  <h5 className="mb-0">สถานะ Cron Jobs</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>งาน</th>
                          <th>กำหนดการ</th>
                          <th>ครั้งถัดไป</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.cronJobs.map((job, index) => (
                          <tr key={index}>
                            <td><small>{job.name}</small></td>
                            <td><small>{job.schedule}</small></td>
                            <td>
                              <small>
                                {format(new Date(job.nextRun), 'dd/MM HH:mm', { locale: th })}
                              </small>
                            </td>
                            <td>{getStatusBadge(job.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Logs */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header bg-light">
                  <h5 className="mb-0">การแจ้งเตือนล่าสุด</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>ประเภท</th>
                          <th>ผู้รับ</th>
                          <th>เวลา</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentLogs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <small>{getTypeIcon(log.type)}</small>
                            </td>
                            <td>
                              <small title={log.user.email}>
                                {log.user.name}
                              </small>
                            </td>
                            <td>
                              <small>
                                {format(new Date(log.sentAt), 'dd/MM HH:mm', { locale: th })}
                              </small>
                            </td>
                            <td>
                              {log.read ? (
                                <span className="badge bg-success">อ่านแล้ว</span>
                              ) : (
                                <span className="badge bg-warning">ยังไม่อ่าน</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}