// src/app/admin/maintenance/analytics/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Row, Col, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
} from '@/types/maintenance';
import {
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_STATUS_COLORS,
  MAINTENANCE_PRIORITY_COLORS,
} from '@/types/maintenance';

interface AnalyticsData {
  overallStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalCost: number;
    avgCost: number;
  };
  categoryStats: {
    _id: MaintenanceCategory;
    count: number;
    totalCost: number;
    avgCost: number;
    completedCount: number;
  }[];
  priorityStats: {
    _id: MaintenancePriority;
    count: number;
    totalCost: number;
    avgCost: number;
    completedCount: number;
  }[];
  monthlyTrends: {
    _id: { year: number; month: number };
    count: number;
    totalCost: number;
    completedCount: number;
  }[];
  completionTimeAnalysis: {
    avgCompletionDays: number;
    minCompletionDays: number;
    maxCompletionDays: number;
  };
  completionTimeByCategory: {
    _id: MaintenanceCategory;
    avgCompletionDays: number;
    count: number;
  }[];
  roomMaintenanceStats: {
    roomId: string;
    roomNumber: string;
    floor?: number;
    count: number;
    totalCost: number;
    completedCount: number;
  }[];
  urgentPending: {
    _id: string;
    roomId: { roomNumber: string; floor?: number };
    title: string;
    priority: MaintenancePriority;
    reportedDate: string;
  }[];
  costTrends: {
    _id: { year: number; month: number };
    totalCost: number;
    avgCost: number;
    count: number;
  }[];
}

const MaintenanceAnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/maintenance/analytics');
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

  const formatMonthlyTrendsData = (trends: AnalyticsData['monthlyTrends']) => {
    return trends.map(item => ({
      name: `เดือน ${item._id.month}/${item._id.year.toString().slice(-2)}`,
      'จำนวนรายการ': item.count,
      'เสร็จสิ้น': item.completedCount,
      'ค่าใช้จ่าย': item.totalCost,
    })).reverse();
  };

  const formatCategoryData = (categories: AnalyticsData['categoryStats']) => {
    return categories.map(item => ({
      name: MAINTENANCE_CATEGORY_LABELS[item._id],
      value: item.count,
      cost: item.totalCost,
    }));
  };

  const formatPriorityData = (priorities: AnalyticsData['priorityStats']) => {
    return priorities.map(item => ({
      name: MAINTENANCE_PRIORITY_LABELS[item._id],
      value: item.count,
      cost: item.totalCost,
    }));
  };

  const formatCompletionTimeData = (completionTimes: AnalyticsData['completionTimeByCategory']) => {
    return completionTimes.map(item => ({
      name: MAINTENANCE_CATEGORY_LABELS[item._id],
      'วันเฉลี่ย': item.avgCompletionDays.toFixed(1),
      'จำนวนรายการ': item.count,
    }));
  };

  const formatCostTrendsData = (trends: AnalyticsData['costTrends']) => {
    return trends.map(item => ({
      name: `เดือน ${item._id.month}/${item._id.year.toString().slice(-2)}`,
      'ค่าใช้จ่ายรวม': item.totalCost,
      'ค่าใช้จ่ายเฉลี่ย': item.avgCost,
      'จำนวนรายการ': item.count,
    })).reverse();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="container-fluid mt-4">
      <Card>
        <Card.Header>
          <h3><i className="bi bi-graph-up me-2"></i>วิเคราะห์ข้อมูลการแจ้งซ่อม</h3>
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
            {/* Overall Statistics */}
            <Row className="mb-4">
              <Col md={2}>
                <Card className="text-center bg-primary text-white">
                  <Card.Body>
                    <Card.Title>ทั้งหมด</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.overallStats.total.toLocaleString('th-TH')}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center bg-warning text-dark">
                  <Card.Body>
                    <Card.Title>รอดำเนินการ</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.overallStats.pending.toLocaleString('th-TH')}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center bg-info text-white">
                  <Card.Body>
                    <Card.Title>กำลังดำเนินการ</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.overallStats.inProgress.toLocaleString('th-TH')}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center bg-success text-white">
                  <Card.Body>
                    <Card.Title>เสร็จสิ้น</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.overallStats.completed.toLocaleString('th-TH')}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center bg-danger text-white">
                  <Card.Body>
                    <Card.Title>ยกเลิก</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.overallStats.cancelled.toLocaleString('th-TH')}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="text-center bg-secondary text-white">
                  <Card.Body>
                    <Card.Title>ค่าใช้จ่ายรวม</Card.Title>
                    <Card.Text className="fs-4 fw-bold">{data.overallStats.totalCost.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Tabs defaultActiveKey="trends" className="mb-4">
              <Tab eventKey="trends" title="แนวโน้มรายเดือน">
                <h5>แนวโน้มการแจ้งซ่อมรายเดือน</h5>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={formatMonthlyTrendsData(data.monthlyTrends)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'ค่าใช้จ่าย' ? `${value.toLocaleString('th-TH')} บาท` : `${value.toLocaleString('th-TH')} รายการ`,
                        name
                      ]} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="จำนวนรายการ" stroke="#8884d8" />
                      <Line yAxisId="left" type="monotone" dataKey="เสร็จสิ้น" stroke="#82ca9d" />
                      <Line yAxisId="right" type="monotone" dataKey="ค่าใช้จ่าย" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Tab>

              <Tab eventKey="categories" title="หมวดหมู่">
                <Row>
                  <Col md={6}>
                    <h5>การแจ้งซ่อมตามหมวดหมู่</h5>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={formatCategoryData(data.categoryStats)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {formatCategoryData(data.categoryStats).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} รายการ`, 'จำนวน']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col md={6}>
                    <h5>รายละเอียดตามหมวดหมู่</h5>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>หมวดหมู่</th>
                          <th>จำนวน</th>
                          <th>เสร็จสิ้น</th>
                          <th>ค่าใช้จ่ายรวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.categoryStats.map((category, index) => (
                          <tr key={index}>
                            <td>{MAINTENANCE_CATEGORY_LABELS[category._id]}</td>
                            <td>{category.count.toLocaleString('th-TH')}</td>
                            <td>{category.completedCount.toLocaleString('th-TH')}</td>
                            <td>{category.totalCost.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="priority" title="ความสำคัญ">
                <Row>
                  <Col md={6}>
                    <h5>การแจ้งซ่อมตามความสำคัญ</h5>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={formatPriorityData(data.priorityStats)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value.toLocaleString('th-TH')} รายการ`, 'จำนวน']} />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Col>
                  <Col md={6}>
                    <h5>รายละเอียดตามความสำคัญ</h5>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>ความสำคัญ</th>
                          <th>จำนวน</th>
                          <th>เสร็จสิ้น</th>
                          <th>ค่าใช้จ่ายรวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.priorityStats.map((priority, index) => (
                          <tr key={index}>
                            <td>
                              <Badge bg={MAINTENANCE_PRIORITY_COLORS[priority._id]}>
                                {MAINTENANCE_PRIORITY_LABELS[priority._id]}
                              </Badge>
                            </td>
                            <td>{priority.count.toLocaleString('th-TH')}</td>
                            <td>{priority.completedCount.toLocaleString('th-TH')}</td>
                            <td>{priority.totalCost.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="completion" title="เวลาดำเนินการ">
                <Row className="mb-4">
                  <Col md={3}>
                    <Card className="text-center bg-info text-white">
                      <Card.Body>
                        <Card.Title>เวลาเฉลี่ย</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.completionTimeAnalysis.avgCompletionDays.toFixed(1)} วัน</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-success text-white">
                      <Card.Body>
                        <Card.Title>เร็วที่สุด</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.completionTimeAnalysis.minCompletionDays.toFixed(0)} วัน</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-warning text-dark">
                      <Card.Body>
                        <Card.Title>ช้าที่สุด</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.completionTimeAnalysis.maxCompletionDays.toFixed(0)} วัน</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={3}>
                    <Card className="text-center bg-primary text-white">
                      <Card.Body>
                        <Card.Title>ค่าใช้จ่ายเฉลี่ย</Card.Title>
                        <Card.Text className="fs-4 fw-bold">{data.overallStats.avgCost.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <h5>เวลาดำเนินการตามหมวดหมู่</h5>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={formatCompletionTimeData(data.completionTimeByCategory)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number, name: string) => [
                        name === 'วันเฉลี่ย' ? `${value} วัน` : `${value} รายการ`,
                        name
                      ]} />
                      <Legend />
                      <Bar dataKey="วันเฉลี่ย" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Tab>

              <Tab eventKey="costs" title="ค่าใช้จ่าย">
                <h5>แนวโน้มค่าใช้จ่ายรายเดือน</h5>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={formatCostTrendsData(data.costTrends)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value: number, name: string) => [
                        name.includes('ค่าใช้จ่าย') ? `${value.toLocaleString('th-TH')} บาท` : `${value.toLocaleString('th-TH')} รายการ`,
                        name
                      ]} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="ค่าใช้จ่ายรวม" stroke="#8884d8" />
                      <Line yAxisId="left" type="monotone" dataKey="ค่าใช้จ่ายเฉลี่ย" stroke="#82ca9d" />
                      <Line yAxisId="right" type="monotone" dataKey="จำนวนรายการ" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Tab>

              <Tab eventKey="rooms" title="ห้องที่แจ้งซ่อมบ่อย">
                <h5>ห้องที่มีการแจ้งซ่อมบ่อยที่สุด</h5>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ห้อง</th>
                      <th>ชั้น</th>
                      <th>จำนวนครั้ง</th>
                      <th>เสร็จสิ้น</th>
                      <th>ค่าใช้จ่ายรวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.roomMaintenanceStats.map((room, index) => (
                      <tr key={index}>
                        <td>{room.roomNumber}</td>
                        <td>{room.floor || '-'}</td>
                        <td>{room.count.toLocaleString('th-TH')}</td>
                        <td>{room.completedCount.toLocaleString('th-TH')}</td>
                        <td>{room.totalCost.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="urgent" title="รายการเร่งด่วน">
                <h5>รายการแจ้งซ่อมที่รอดำเนินการ (ความสำคัญ: เร่งด่วน)</h5>
                {data.urgentPending.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-check-circle" style={{ fontSize: '3rem', color: '#28a745' }}></i>
                    <p className="mt-3 text-muted">ไม่มีรายการแจ้งซ่อมที่รอดำเนินการ</p>
                  </div>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>ห้อง</th>
                        <th>หัวข้อ</th>
                        <th>วันที่แจ้ง</th>
                        <th>จำนวนวันที่รอ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.urgentPending.map((request, index) => {
                        const daysWaiting = Math.floor(
                          (new Date().getTime() - new Date(request.reportedDate).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <tr key={index}>
                            <td>{request.roomId.roomNumber}</td>
                            <td>{request.title}</td>
                            <td>{new Date(request.reportedDate).toLocaleDateString('th-TH')}</td>
                            <td>
                              <Badge bg={daysWaiting > 3 ? 'danger' : daysWaiting > 1 ? 'warning' : 'info'}>
                                {daysWaiting} วัน
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Tab>
            </Tabs>
          </Card.Body>
        )}
      </Card>
    </div>
  );
};

export default MaintenanceAnalyticsPage;