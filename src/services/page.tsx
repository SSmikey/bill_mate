// src/app/admin/payments/analytics/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
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

  return (
    <div className="container-fluid mt-4">
      <Card>
        <Card.Header>
          <h3><i className="bi bi-bar-chart-line-fill me-2"></i>วิเคราะห์ข้อมูลการชำระเงิน</h3>
        </Card.Header>
        {loading && (
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">กำลังโหลดข้อมูล...</p>
          </Card.Body>
        )}
        {error && <Card.Body><Alert variant="danger">{error}</Alert></Card.Body>}
        {!loading && !error && data && (
          <Card.Body>
            <Row className="mb-4">
              <Col md={4}>
                <Card className="text-center bg-success text-white">
                  <Card.Body>
                    <Card.Title>รายรับทั้งหมด</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.totalRevenue.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center bg-warning text-dark">
                  <Card.Body>
                    <Card.Title>รายการรอตรวจสอบ</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.paymentStats.pending.toLocaleString('th-TH')} รายการ</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="text-center bg-danger text-white">
                  <Card.Body>
                    <Card.Title>รายการที่ถูกปฏิเสธ</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.paymentStats.rejected.toLocaleString('th-TH')} รายการ</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <h5>รายรับรายเดือน (12 เดือนล่าสุด)</h5>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={formatChartData(data.monthlyRevenue)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value: number) => new Intl.NumberFormat('th-TH').format(value)} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('th-TH')} บาท`} />
                  <Legend />
                  <Bar dataKey="รายรับ" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        )}
      </Card>
    </div>
  );
};

export default PaymentAnalyticsPage;