// src/app/admin/payments/analytics/page.tsx
"use client";

import React from 'react';
import { Card, Alert } from 'react-bootstrap';

const PaymentAnalyticsPage = () => {
  return (
    <div className="container-fluid mt-4">
      <Card>
        <Card.Header>
          <h3><i className="bi bi-bar-chart-line-fill me-2"></i>วิเคราะห์ข้อมูลการชำระเงิน</h3>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <Alert.Heading>หน้านี้อยู่ระหว่างการพัฒนา</Alert.Heading>
            <p>ส่วนนี้จะแสดงกราฟและข้อมูลสรุปเกี่ยวกับการชำระเงิน เช่น รายรับรายเดือน, อัตราการชำระล่าช้า, และอื่นๆ</p>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentAnalyticsPage;