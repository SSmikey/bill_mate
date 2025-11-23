// src/app/admin/payments/analytics/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Row, Col, Tabs, Tab, Table } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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
    count: number;
  }[];
  paymentMethods: {
    _id: string;
    count: number;
    totalAmount: number;
  }[];
  latePayments: {
    avgDaysLate: number;
    maxDaysLate: number;
    totalLatePayments: number;
    totalLateAmount: number;
  };
  paymentTrends: {
    _id: { year: number; month: number; status: string };
    count: number;
    amount: number;
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
      'จำนวนรายการ': item.count,
    })).reverse(); // Reverse to show oldest month first
  };

  const formatPaymentMethodsData = (methods: AnalyticsData['paymentMethods']) => {
    return methods.map((method, index) => ({
      name: method._id || `บัญชี ${index + 1}`,
      value: method.count,
      amount: method.totalAmount,
    }));
  };

  const formatPaymentTrendsData = (trends: AnalyticsData['paymentTrends']) => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // Group by month and year
    const groupedData: { [key: string]: any } = {};
    
    trends.forEach(trend => {
      const key = `${trend._id.month}/${trend._id.year}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          name: `เดือน ${trend._id.month}/${trend._id.year.toString().slice(-2)}`,
          pending: 0,
          verified: 0,
          rejected: 0,
        };
      }
      
      groupedData[key][trend._id.status] = trend.count;
    });
    
    return Object.values(groupedData).sort((a: any, b: any) => {
      const [monthA, yearA] = a.name.split('/').map(Number);
      const [monthB, yearB] = b.name.split('/').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
              <Col md={3}>
                <Card className="text-center bg-success text-white">
                  <Card.Body>
                    <Card.Title>รายรับทั้งหมด</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.totalRevenue.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center bg-warning text-dark">
                  <Card.Body>
                    <Card.Title>รายการรอตรวจสอบ</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.paymentStats.pending.toLocaleString('th-TH')} รายการ</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center bg-info text-white">
                  <Card.Body>
                    <Card.Title>รายการที่ยืนยันแล้ว</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.paymentStats.verified.toLocaleString('th-TH')} รายการ</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center bg-danger text-white">
                  <Card.Body>
                    <Card.Title>รายการที่ถูกปฏิเสธ</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.paymentStats.rejected.toLocaleString('th-TH')} รายการ</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Tabs defaultActiveKey="revenue" className="mb-4">
              <Tab eventKey="revenue" title="รายรับรายเดือน">
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={formatChartData(data.monthlyRevenue)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" tickFormatter={(value: number) => new Intl.NumberFormat('th-TH').format(value)} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'รายรับ' ? `${value.toLocaleString('th-TH')} บาท` : `${value.toLocaleString('th-TH')} รายการ`,
                        name
                      ]} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="รายรับ" fill="#82ca9d" />
                      <Bar yAxisId="right" dataKey="จำนวนรายการ" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Tab>
              
              <Tab eventKey="methods" title="ช่องทางการชำระเงิน">
                <Row>
                  <Col md={6}>
                    <h5>การใช้ช่องทางการชำระเงิน</h5>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={formatPaymentMethodsData(data.paymentMethods)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {formatPaymentMethodsData(data.paymentMethods).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} รายการ`, 'จำนวน']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col md={6}>
                    <h5>รายละเอียดช่องทางการชำระเงิน</h5>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>ช่องทาง</th>
                          <th>จำนวนรายการ</th>
                          <th>ยอดเงินรวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formatPaymentMethodsData(data.paymentMethods).map((method, index) => (
                          <tr key={index}>
                            <td>{method.name}</td>
                            <td>{method.value.toLocaleString('th-TH')}</td>
                            <td>{method.amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="late" title="การชำระเงินล่าช้า">
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="text-center bg-warning text-dark">
                      <Card.Body>
                        <Card.Title>จำนวนรายการล่าช้า</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.latePayments.totalLatePayments.toLocaleString('th-TH')} รายการ</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-danger text-white">
                      <Card.Body>
                        <Card.Title>มูลค่ารายการล่าช้า</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.latePayments.totalLateAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-info text-white">
                      <Card.Body>
                        <Card.Title>วันเฉลี่ยที่ล่าช้า</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.latePayments.avgDaysLate.toFixed(1)} วัน</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-secondary text-white">
                      <Card.Body>
                        <Card.Title>ล่าช้านานที่สุด</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.latePayments.maxDaysLate.toFixed(0)} วัน</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="trends" title="แนวโน้มการชำระเงิน">
                <h5>แนวโน้มการชำระเงินรายเดือน</h5>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={formatPaymentTrendsData(data.paymentTrends)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString('th-TH')} รายการ`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="pending" stroke="#FFBB28" name="รอตรวจสอบ" />
                      <Line type="monotone" dataKey="verified" stroke="#00C49F" name="ยืนยันแล้ว" />
                      <Line type="monotone" dataKey="rejected" stroke="#FF8042" name="ถูกปฏิเสธ" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        )}
      </Card>
    </div>
  );
};

export default PaymentAnalyticsPage;
