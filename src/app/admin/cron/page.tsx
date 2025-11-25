'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface CronJobStatus {
  [key: string]: boolean;
}

interface NextRunTimes {
  [key: string]: string;
}

export default function AdminCronPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobStatus, setJobStatus] = useState<CronJobStatus>({});
  const [nextRunTimes, setNextRunTimes] = useState<NextRunTimes>({});
  const [loading, setLoading] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchCronStatus();
  }, [status, session, router]);

  const fetchCronStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cron/status');
      const data = await response.json();

      if (data.success) {
        setJobStatus(data.data.jobStatus);
        setNextRunTimes(data.data.nextRunTimes);
      }
    } catch (error) {
      console.error('Failed to fetch cron status:', error);
      alert('ไม่สามารถดึงข้อมูลสถานะ cron jobs ได้');
    } finally {
      setLoading(false);
    }
  };

  const runJobManually = async (jobName: string) => {
    if (!confirm(`คุณต้องการรันงาน "${jobName}" ตอนนี้หรือไม่?`)) {
      return;
    }

    try {
      setRunningJob(jobName);
      const response = await fetch('/api/cron/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobName }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchCronStatus(); // Refresh status
      } else {
        alert(data.error || 'ไม่สามารถรันงานได้');
      }
    } catch (error) {
      console.error('Failed to run job:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setRunningJob(null);
    }
  };

  const getJobDisplayName = (jobKey: string): string => {
    const names: { [key: string]: string } = {
      'paymentReminder5Days': 'แจ้งเตือนการชำระเงิน (5 วัน)',
      'paymentReminder1Day': 'แจ้งเตือนการชำระเงิน (1 วัน)',
      'overdueNotifications': 'แจ้งเตือนเมื่อเกินกำหนด',
      'monthlyBillGeneration': 'สร้างบิลรายเดือน',
      'notificationCleanup': 'ลบการแจ้งเตือนเก่า'
    };
    return names[jobKey] || jobKey;
  };

  const getJobDescription = (jobKey: string): string => {
    const descriptions: { [key: string]: string } = {
      'paymentReminder5Days': 'ส่งการแจ้งเตือน 5 วันก่อนครบกำหนดชำระเงิน (เวลา 09:00)',
      'paymentReminder1Day': 'ส่งการแจ้งเตือน 1 วันก่อนครบกำหนดชำระเงิน (เวลา 18:00)',
      'overdueNotifications': 'ส่งการแจ้งเตือนเมื่อเกินกำหนดชำระเงิน (เวลา 10:00)',
      'monthlyBillGeneration': 'สร้างบิลค่าเช่ารายเดือนอัตโนมัติ (วันที่ 1 เวลา 08:00)',
      'notificationCleanup': 'ลบการแจ้งเตือนที่อ่านแล้วและเกิน 30 วัน (วันอาทิตย์ เวลา 01:00)'
    };
    return descriptions[jobKey] || '';
  };

  if (status === 'loading') {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>จัดการ Cron Jobs</h2>
            <button 
              className="btn btn-outline-primary"
              onClick={fetchCronStatus}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              รีเฟรชสถานะ
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">สถานะงานอัตโนมัติ</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>งาน</th>
                        <th>คำอธิบาย</th>
                        <th>สถานะ</th>
                        <th>รันครั้งต่อไป</th>
                        <th>การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(jobStatus).map(([jobKey, isRunning]) => (
                        <tr key={jobKey}>
                          <td className="fw-bold">{getJobDisplayName(jobKey)}</td>
                          <td className="text-muted small">{getJobDescription(jobKey)}</td>
                          <td>
                            <span className={`badge ${isRunning ? 'bg-success' : 'bg-secondary'}`}>
                              {isRunning ? 'กำลังทำงาน' : 'หยุดอยู่'}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {nextRunTimes[jobKey] || '-'}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => runJobManually(jobKey)}
                              disabled={runningJob === jobKey}
                            >
                              {runningJob === jobKey ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1"></span>
                                  กำลังรัน...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-play-fill me-1"></i>
                                  รันตอนนี้
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">ข้อมูลเพิ่มเติม</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>เขตเวลา</h6>
                  <p className="text-muted">ทุกงานอัตโนมัติใช้เขตเวลา Asia/Bangkok (GMT+7)</p>
                </div>
                <div className="col-md-6">
                  <h6>การจัดการข้อผิดพลาด</h6>
                  <p className="text-muted">หากงานล้มเหลว ระบบจะพยายามรันใหม่สูงสุด 3 ครั้ง (พร้อม Exponential Backoff)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}