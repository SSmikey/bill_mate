// src/app/admin/payments/analytics/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalRevenue: number;
  paymentStats: {
    pending: number;
    verified: number;
    rejected: number;
  };
  monthlyRevenue: {
    _id: { year: number; month: number };
    revenue: number;
  }[];
}

const PaymentAnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/payments/analytics');
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลวิเคราะห์ได้');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatChartData = (chartData: AnalyticsData['monthlyRevenue']) => {
    return chartData.map(item => ({
      name: `เดือน ${item._id.month}/${item._id.year.toString().slice(-2)}`,
      'รายรับ': item.revenue,
    })).reverse(); // Reverse to show oldest month first
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-80">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
          <h5 className="text-muted">กำลังโหลดข้อมูล...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-2">
          <i className="bi bi-bar-chart-line-fill me-2"></i>
          วิเคราะห์ข้อมูลการชำระเงิน
        </h1>
        <p className="text-muted mb-0">ภาพรวมรายรับและสถิติการชำระเงิน</p>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {!error && data && (
        <>
          {/* Stats Cards */}
          <Row className="mb-5 g-3">
            <Col lg={4} md={6}>
              <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">รายรับทั้งหมด</p>
                      <h3 className="mb-0 fw-bold text-dark">
                        {data.totalRevenue.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}
                      </h3>
                    </div>
                    <div className="rounded-circle p-3 bg-success bg-opacity-10">
                      <i className="bi bi-currency-dollar fs-4 text-success"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={4} md={6}>
              <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">รอตรวจสอบ</p>
                      <h3 className="mb-0 fw-bold text-dark">
                        {data.paymentStats.pending.toLocaleString('th-TH')}
                      </h3>
                      <p className="text-muted small mb-0">รายการ</p>
                    </div>
                    <div className="rounded-circle p-3 bg-warning bg-opacity-10">
                      <i className="bi bi-clock-history fs-4 text-warning"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col lg={4} md={6}>
              <div className="card border-0 h-100 bg-white rounded-3 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="text-muted small mb-1">ถูกปฏิเสธ</p>
                      <h3 className="mb-0 fw-bold text-dark">
                        {data.paymentStats.rejected.toLocaleString('th-TH')}
                      </h3>
                      <p className="text-muted small mb-0">รายการ</p>
                    </div>
                    <div className="rounded-circle p-3 bg-danger bg-opacity-10">
                      <i className="bi bi-x-circle-fill fs-4 text-danger"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          {/* Chart Section */}
          <div className="card border-0 bg-white rounded-3 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark mb-4">
                <i className="bi bi-graph-up me-2"></i>
                รายรับรายเดือน (12 เดือนล่าสุด)
              </h5>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={formatChartData(data.monthlyRevenue)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#6c757d' }}
                      tickLine={{ stroke: '#6c757d' }}
                    />
                    <YAxis
                      tickFormatter={(value: number) => new Intl.NumberFormat('th-TH').format(value)}
                      tick={{ fill: '#6c757d' }}
                      tickLine={{ stroke: '#6c757d' }}
                    />
                    <Tooltip
                      formatter={(value: number) => `${value.toLocaleString('th-TH')} บาท`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#212529' }} />
                    <Bar dataKey="รายรับ" fill="#198754" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentAnalyticsPage;
