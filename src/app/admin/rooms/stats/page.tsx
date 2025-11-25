'use client';

import { useState, useEffect } from 'react';
import StyledSelect from '@/app/components/StyledSelect';

interface RoomStats {
  overview: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;
  };
  revenue: {
    total: number;
    billCount: number;
    avgPerBill: number;
    byRoom: Array<{
      _id: string;
      roomNumber: string;
      floor?: number;
      revenue: number;
      billCount: number;
    }>;
  };
  pricing: {
    avgRent: number;
    minRent: number;
    maxRent: number;
    avgWater: number;
    avgElectricity: number;
  };
  floors: Array<{
    floor: string | number;
    total: number;
    occupied: number;
    available: number;
    occupancyRate: string;
  }>;
  trends: {
    occupancy: Array<{
      year: number;
      month: number;
      occupiedCount: number;
    }>;
  };
  rental: {
    avgRentalPeriodDays: number;
    avgRentalPeriodMonths: string;
  };
  payments: Record<string, { count: number; amount: number }>;
  topRooms: Array<{
    _id: string;
    roomNumber: string;
    floor?: number;
    totalRevenue: number;
    billCount: number;
    avgRevenue: number;
  }>;
}

export default function RoomStatsPage() {
  const [stats, setStats] = useState<RoomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [period, setPeriod] = useState<'all' | 'month' | 'year'>('all');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  useEffect(() => {
    fetchStats();
  }, [period, year, month]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        period,
        year,
      });

      if (period === 'month') {
        params.append('month', month);
      }

      const response = await fetch(`/api/rooms/stats?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงสถิติได้');
      }

      setStats(result.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงสถิติ');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNum: number): string => {
    const months = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    return months[monthNum - 1] || '';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-80">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <h5 className="text-muted">กำลังโหลดสถิติ...</h5>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error || 'ไม่สามารถแสดงสถิติได้'}
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header - Clean and minimal */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">สถิติห้องพัก</h1>
        <p className="text-muted mb-0">ภาพรวมและสถิติการจัดการห้องพัก</p>
      </div>

      {/* Filters */}
      <div className="card border-0 bg-white rounded-3 shadow-sm mb-5">
        <div className="card-body p-4">
          <div className="d-flex align-items-center mb-4">
            <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
              <i className="bi bi-funnel fs-5 text-primary"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">ตัวกรองข้อมูล</h6>
              <p className="mb-0 small text-muted">เลือกช่วงเวลาที่ต้องการดูสถิติ</p>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <StyledSelect
                value={period}
                onChange={(val) => setPeriod(val as 'all' | 'month' | 'year')}
                label="ช่วงเวลา"
                icon="bi bi-calendar-range"
                options={[
                  { value: 'all', label: 'ทั้งหมด' },
                  { value: 'year', label: 'รายปี' },
                  { value: 'month', label: 'รายเดือน' },
                ]}
              />
            </div>

            {(period === 'year' || period === 'month') && (
              <div className="col-md-4">
                <StyledSelect
                  value={year}
                  onChange={(val) => setYear(String(val))}
                  label="ปี"
                  icon="bi bi-calendar"
                  options={Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return {
                      value: y.toString(),
                      label: (y + 543).toString(),
                    };
                  })}
                />
              </div>
            )}

            {period === 'month' && (
              <div className="col-md-4">
                <StyledSelect
                  value={month}
                  onChange={setMonth}
                  label="เดือน"
                  icon="bi bi-calendar-month"
                  options={Array.from({ length: 12 }, (_, i) => {
                    const m = i + 1;
                    return {
                      value: m.toString(),
                      label: getMonthName(m),
                    };
                  })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards - Clean white background */}
      <div className="row mb-5 g-3">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ห้องทั้งหมด</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats.overview.totalRooms}</h3>
                </div>
                <div className="rounded-circle p-3 bg-primary bg-opacity-10">
                  <i className="bi bi-house-fill fs-4 text-primary"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ห้องที่มีผู้เช่า</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats.overview.occupiedRooms}</h3>
                </div>
                <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                  <i className="bi bi-person-fill fs-4 text-warning"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">ห้องว่าง</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats.overview.availableRooms}</h3>
                </div>
                <div className="rounded-circle p-3 bg-success bg-opacity-10">
                  <i className="bi bi-door-open fs-4 text-success"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted small mb-1">อัตราการเข้าพัก</p>
                  <h3 className="mb-0 fw-bold text-dark">{stats.overview.occupancyRate.toFixed(1)}%</h3>
                </div>
                <div className="rounded-circle p-3 bg-info bg-opacity-10">
                  <i className="bi bi-percent fs-4 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="row mb-5 g-3">
        <div className="col-lg-8">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-success bg-opacity-10">
                  <i className="bi bi-cash-stack fs-5 text-success"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">รายได้</h6>
                  <p className="mb-0 small text-muted">สรุปรายได้จากค่าเช่าและบริการ</p>
                </div>
              </div>
              <div className="row">
                <div className="col-md-4 text-center mb-3">
                  <h6 className="text-muted">รายได้รวม</h6>
                  <h3 className="text-success">
                    {stats.revenue.total.toLocaleString('th-TH')} ฿
                  </h3>
                </div>
                <div className="col-md-4 text-center mb-3">
                  <h6 className="text-muted">จำนวนบิล</h6>
                  <h3 className="text-primary">{stats.revenue.billCount}</h3>
                </div>
                <div className="col-md-4 text-center mb-3">
                  <h6 className="text-muted">เฉลี่ยต่อบิล</h6>
                  <h3 className="text-info">
                    {stats.revenue.avgPerBill.toLocaleString('th-TH', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    ฿
                  </h3>
                </div>
              </div>

              {/* Top Revenue Rooms */}
              {stats.revenue.byRoom.length > 0 && (
                <div className="mt-4">
                  <h6 className="mb-3">
                    <i className="bi bi-trophy-fill me-2 text-warning"></i>
                    ห้องที่มีรายได้สูงสุด (ช่วงเวลาที่เลือก)
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>หมายเลขห้อง</th>
                          <th className="text-end">รายได้</th>
                          <th className="text-end">จำนวนบิล</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.revenue.byRoom.slice(0, 5).map((room, index) => (
                          <tr key={room._id}>
                            <td>
                              {index === 0 && <i className="bi bi-trophy-fill text-warning me-1"></i>}
                              {index + 1}
                            </td>
                            <td>
                              <strong>{room.roomNumber}</strong>
                              {room.floor && ` (ชั้น ${room.floor})`}
                            </td>
                            <td className="text-end">
                              {room.revenue.toLocaleString('th-TH')} ฿
                            </td>
                            <td className="text-end">{room.billCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="rounded-circle p-3 me-3 bg-info bg-opacity-10">
                  <i className="bi bi-currency-dollar fs-5 text-info"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold text-dark">ราคาเฉลี่ย</h6>
                  <p className="mb-0 small text-muted">ข้อมูลราคาค่าเช่าและบริการ</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between text-dark">
                  <span>ค่าเช่าเฉลี่ย</span>
                  <strong>{stats.pricing.avgRent.toLocaleString('th-TH')} ฿</strong>
                </div>
                <small className="text-muted">
                  {stats.pricing.minRent.toLocaleString('th-TH')} -{' '}
                  {stats.pricing.maxRent.toLocaleString('th-TH')} ฿
                </small>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between text-dark">
                  <span>ค่าน้ำเฉลี่ย</span>
                  <strong>{stats.pricing.avgWater.toLocaleString('th-TH')} ฿</strong>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between text-dark">
                  <span>ค่าไฟเฉลี่ย</span>
                  <strong>{stats.pricing.avgElectricity} ฿/หน่วย</strong>
                </div>
              </div>

              <hr />

              <div>
                <div className="d-flex justify-content-between text-dark">
                  <span>ระยะเวลาเช่าเฉลี่ย</span>
                  <strong>{stats.rental.avgRentalPeriodMonths} เดือน</strong>
                </div>
                <small className="text-muted">
                  ({stats.rental.avgRentalPeriodDays} วัน)
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floors Statistics */}
      {stats.floors.length > 0 && (
        <div className="row mb-5 g-3">
          <div className="col-12">
            <div className="card border-0 bg-white rounded-3 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
                    <i className="bi bi-building fs-5 text-primary"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-semibold text-dark">สถิติแยกตามชั้น</h6>
                    <p className="mb-0 small text-muted">ข้อมูลการเข้าพักแยกตามชั้น</p>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ชั้น</th>
                        <th className="text-center">ห้องทั้งหมด</th>
                        <th className="text-center">มีผู้เช่า</th>
                        <th className="text-center">ว่าง</th>
                        <th className="text-end">อัตราการเข้าพัก</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.floors.map((floor) => (
                        <tr key={floor.floor}>
                          <td>
                            <strong>ชั้น {floor.floor}</strong>
                          </td>
                          <td className="text-center">{floor.total}</td>
                          <td className="text-center">
                            <span className="badge bg-warning bg-opacity-10 text-warning fw-semibold px-2 py-1 rounded-2">
                              {floor.occupied}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success bg-opacity-10 text-success fw-semibold px-2 py-1 rounded-2">
                              {floor.available}
                            </span>
                          </td>
                          <td className="text-end">
                            <strong>{parseFloat(floor.occupancyRate).toFixed(1)}%</strong>
                            <div className="progress bg-light rounded-3" style={{ height: '8px' }}>
                              <div
                                className="progress-bar bg-info"
                                role="progressbar"
                                style={{ width: `${floor.occupancyRate}%` }}
                              ></div>
                            </div>
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
      )}

      {/* Top All-Time Revenue Rooms */}
      {stats.topRooms.length > 0 && (
        <div className="row mb-5 g-3">
          <div className="col-12">
            <div className="card border-0 bg-white rounded-3 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle p-3 me-3 bg-warning bg-opacity-10">
                    <i className="bi bi-star-fill fs-5 text-warning"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-semibold text-dark">ห้องที่มีรายได้สูงสุดตลอดกาล (Top 5)</h6>
                    <p className="mb-0 small text-muted">จัดอันดับห้องที่มีรายได้สูงสุดตลอดเวลา</p>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>อันดับ</th>
                        <th>หมายเลขห้อง</th>
                        <th className="text-end">รายได้รวม</th>
                        <th className="text-center">จำนวนบิล</th>
                        <th className="text-end">เฉลี่ยต่อบิล</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topRooms.map((room, index) => (
                        <tr key={room._id}>
                          <td>
                            {index < 3 && (
                              <i
                                className={`bi bi-trophy-fill me-1 ${
                                  index === 0
                                    ? 'text-warning'
                                    : index === 1
                                    ? 'text-secondary'
                                    : 'text-danger'
                                }`}
                              ></i>
                            )}
                            {index + 1}
                          </td>
                          <td>
                            <strong>{room.roomNumber}</strong>
                            {room.floor && ` (ชั้น ${room.floor})`}
                          </td>
                          <td className="text-end">
                            <strong className="text-success">
                              {room.totalRevenue.toLocaleString('th-TH')} ฿
                            </strong>
                          </td>
                          <td className="text-center">{room.billCount}</td>
                          <td className="text-end">
                            {room.avgRevenue.toLocaleString('th-TH', {
                              maximumFractionDigits: 0,
                            })}{' '}
                            ฿
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
      )}

      {/* Payment Status */}
      {Object.keys(stats.payments).length > 0 && (
        <div className="row g-3">
          <div className="col-12">
            <div className="card border-0 bg-white rounded-3 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="rounded-circle p-3 me-3 bg-primary bg-opacity-10">
                    <i className="bi bi-credit-card fs-5 text-primary"></i>
                  </div>
                  <div>
                    <h6 className="mb-0 fw-semibold text-dark">สถานะการชำระเงิน</h6>
                    <p className="mb-0 small text-muted">สรุปสถานะการชำระเงินทั้งหมด</p>
                  </div>
                </div>
                <div className="row">
                  {Object.entries(stats.payments).map(([status, data]) => {
                    const statusLabels: Record<string, string> = {
                      paid: 'ชำระแล้ว',
                      pending: 'รอชำระ',
                      overdue: 'เกินกำหนด',
                      cancelled: 'ยกเลิก',
                    };

                    const statusColors: Record<string, string> = {
                      paid: 'success',
                      pending: 'warning',
                      overdue: 'danger',
                      cancelled: 'secondary',
                    };

                    return (
                      <div key={status} className="col-lg-3 col-md-6 text-center mb-3">
                        <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
                          <div className="card-body p-4">
                            <div
                              className={`rounded-circle p-3 mb-3 bg-${statusColors[status]} bg-opacity-10 mx-auto d-flex align-items-center justify-content-center`}
                              style={{ width: '60px', height: '60px' }}
                            >
                              <i className={`bi bi-${
                                status === 'paid' ? 'check-circle' :
                                status === 'pending' ? 'clock' :
                                status === 'overdue' ? 'exclamation-circle' :
                                'x-circle'
                              } fs-4 text-${statusColors[status]}`}></i>
                            </div>
                            <h6 className={`text-${statusColors[status]} fw-semibold`}>{statusLabels[status] || status}</h6>
                            <h4 className={`text-${statusColors[status]} mb-1`}>{data.count} บิล</h4>
                            <small className="text-muted">{data.amount.toLocaleString('th-TH')} ฿</small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}