'use client';

import { useState, useEffect } from 'react';

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
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <p className="mt-3 text-muted">กำลังโหลดสถิติ...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error || 'ไม่สามารถแสดงสถิติได้'}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>
                <i className="bi bi-graph-up me-2"></i>
                สถิติห้องพัก
              </h2>
              <small className="text-muted">
                ภาพรวมและสถิติการจัดการห้องพัก
              </small>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="bi bi-calendar-range me-2"></i>
                    ช่วงเวลา
                  </label>
                  <select
                    className="form-select"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as 'all' | 'month' | 'year')}
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="year">รายปี</option>
                    <option value="month">รายเดือน</option>
                  </select>
                </div>

                {(period === 'year' || period === 'month') && (
                  <div className="col-md-4">
                    <label className="form-label">
                      <i className="bi bi-calendar me-2"></i>
                      ปี
                    </label>
                    <select
                      className="form-select"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const y = new Date().getFullYear() - i;
                        return (
                          <option key={y} value={y}>
                            {y + 543}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {period === 'month' && (
                  <div className="col-md-4">
                    <label className="form-label">
                      <i className="bi bi-calendar-month me-2"></i>
                      เดือน
                    </label>
                    <select
                      className="form-select"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = i + 1;
                        return (
                          <option key={m} value={m}>
                            {getMonthName(m)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-white bg-primary">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title">ห้องทั้งหมด</h6>
                      <h2 className="mb-0">{stats.overview.totalRooms}</h2>
                    </div>
                    <i className="bi bi-house-door" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-white bg-warning">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title">ห้องที่มีผู้เช่า</h6>
                      <h2 className="mb-0">{stats.overview.occupiedRooms}</h2>
                    </div>
                    <i className="bi bi-person-fill" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-white bg-success">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title">ห้องว่าง</h6>
                      <h2 className="mb-0">{stats.overview.availableRooms}</h2>
                    </div>
                    <i className="bi bi-door-open" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card text-white bg-info">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title">อัตราการเข้าพัก</h6>
                      <h2 className="mb-0">{stats.overview.occupancyRate.toFixed(1)}%</h2>
                    </div>
                    <i className="bi bi-percent" style={{ fontSize: '3rem', opacity: 0.5 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Section */}
          <div className="row mb-4">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-cash-stack me-2"></i>
                    รายได้
                  </h5>
                </div>
                <div className="card-body">
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

            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-currency-dollar me-2"></i>
                    ราคาเฉลี่ย
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>ค่าเช่าเฉลี่ย</span>
                      <strong>{stats.pricing.avgRent.toLocaleString('th-TH')} ฿</strong>
                    </div>
                    <small className="text-muted">
                      {stats.pricing.minRent.toLocaleString('th-TH')} -{' '}
                      {stats.pricing.maxRent.toLocaleString('th-TH')} ฿
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>ค่าน้ำเฉลี่ย</span>
                      <strong>{stats.pricing.avgWater.toLocaleString('th-TH')} ฿</strong>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>ค่าไฟเฉลี่ย</span>
                      <strong>{stats.pricing.avgElectricity} ฿/หน่วย</strong>
                    </div>
                  </div>

                  <hr />

                  <div>
                    <div className="d-flex justify-content-between">
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
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-building me-2"></i>
                      สถิติแยกตามชั้น
                    </h5>
                  </div>
                  <div className="card-body">
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
                                <span className="badge bg-warning">{floor.occupied}</span>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-success">{floor.available}</span>
                              </td>
                              <td className="text-end">
                                <strong>{parseFloat(floor.occupancyRate).toFixed(1)}%</strong>
                                <div className="progress" style={{ height: '5px' }}>
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
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-star-fill me-2 text-warning"></i>
                      ห้องที่มีรายได้สูงสุดตลอดกาล (Top 5)
                    </h5>
                  </div>
                  <div className="card-body">
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
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title mb-0">
                      <i className="bi bi-credit-card me-2"></i>
                      สถานะการชำระเงิน
                    </h5>
                  </div>
                  <div className="card-body">
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
                          <div key={status} className="col-md-3 text-center mb-3">
                            <div className={`card bg-${statusColors[status]} text-white`}>
                              <div className="card-body">
                                <h6>{statusLabels[status] || status}</h6>
                                <h4>{data.count} บิล</h4>
                                <small>{data.amount.toLocaleString('th-TH')} ฿</small>
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
      </div>
    </div>
  );
}