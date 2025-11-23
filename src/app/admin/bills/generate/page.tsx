// src/app/admin/bills/generate/page.tsx
"use client";

import React, { useState } from 'react';
import { Button, Card, Spinner, Alert } from 'react-bootstrap';

const GenerateBillsPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/bills/generate', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการสร้างบิล');
      }

      setMessage(result.message || 'เริ่มกระบวนการสร้างบิลรายเดือนสำเร็จ');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-4">
      <Card>
        <Card.Header><h3><i className="bi bi-lightning-charge-fill me-2"></i>สร้างบิลรายเดือนอัตโนมัติ</h3></Card.Header>
        <Card.Body>
          <Card.Title>สร้างบิลสำหรับห้องพักทั้งหมด</Card.Title>
          <Card.Text>คลิกปุ่มด้านล่างเพื่อเริ่มกระบวนการสร้างบิลค่าเช่าและค่าบริการอื่นๆ สำหรับผู้เช่าทั้งหมดในระบบตามรอบเดือนปัจจุบัน</Card.Text>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> กำลังสร้าง...</> : 'เริ่มสร้างบิล'}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default GenerateBillsPage;