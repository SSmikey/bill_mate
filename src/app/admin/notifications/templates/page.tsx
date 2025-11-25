// src/app/admin/notifications/templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Template {
  _id: string;
  type: string;
  name: string;
  subject: string;
  emailBody: string;
  inAppTitle: string;
  inAppMessage: string;
  variables: string[];
  isActive: boolean;
  version: number;
  lastModifiedBy?: {
    name: string;
    email: string;
  };
  updatedAt: string;
}

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    subject: '',
    emailBody: '',
    inAppTitle: '',
    inAppMessage: '',
    variables: [] as string[],
    isActive: true
  });

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/tenant/dashboard');
    }
  }, [status, session, router]);

  // Fetch templates
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchTemplates();
    }
  }, [status, session]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/templates');
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }

  // Initialize default templates
  async function initializeDefaults() {
    if (!confirm('ต้องการสร้าง templates เริ่มต้นหรือไม่?')) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications/templates', {
        method: 'PUT'
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
        await fetchTemplates();
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error initializing templates:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  // Open editor
  function editTemplate(template: Template) {
    setSelectedTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      subject: template.subject,
      emailBody: template.emailBody,
      inAppTitle: template.inAppTitle,
      inAppMessage: template.inAppMessage,
      variables: template.variables,
      isActive: template.isActive
    });
    setShowEditor(true);
  }

  // Save template
  async function saveTemplate() {
    try {
      setSaving(true);

      const response = await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
        setShowEditor(false);
        setSelectedTemplate(null);
        await fetchTemplates();
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  // Insert variable
  function insertVariable(field: 'subject' | 'emailBody' | 'inAppTitle' | 'inAppMessage', variable: string) {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + `{{${variable}}}`
    }));
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

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-3">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 mb-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-file-text"></i> จัดการ Templates การแจ้งเตือน
        </h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={fetchTemplates}>
            <i className="bi bi-arrow-clockwise"></i> รีเฟรช
          </button>
          <button className="btn btn-primary" onClick={initializeDefaults}>
            <i className="bi bi-plus-circle"></i> สร้าง Templates เริ่มต้น
          </button>
        </div>
      </div>

      {/* Templates List */}
      {!showEditor ? (
        <div className="row">
          {templates.length === 0 ? (
            <div className="col-12">
              <div className="alert alert-info">
                <i className="bi bi-info-circle"></i> ยังไม่มี templates
                <button className="btn btn-sm btn-primary ms-3" onClick={initializeDefaults}>
                  สร้าง Templates เริ่มต้น
                </button>
              </div>
            </div>
          ) : (
            templates.map(template => (
              <div key={template._id} className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {getTypeIcon(template.type)} {template.name}
                    </h5>
                    <span className={`badge ${template.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Subject:</strong> {template.subject}</p>
                    <p><strong>In-App Title:</strong> {template.inAppTitle}</p>
                    <p className="small text-muted">
                      Version: {template.version} | 
                      Updated: {new Date(template.updatedAt).toLocaleDateString('th-TH')}
                      {template.lastModifiedBy && ` by ${template.lastModifiedBy.name}`}
                    </p>
                    <div className="mt-2">
                      <span className="badge bg-light text-dark me-1">Variables:</span>
                      {template.variables.map(v => (
                        <span key={v} className="badge bg-secondary me-1">{v}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => editTemplate(template)}
                    >
                      <i className="bi bi-pencil"></i> แก้ไข
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Editor */
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              {getTypeIcon(formData.type)} แก้ไข Template: {formData.name}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-lg-8">
                {/* Subject */}
                <div className="mb-3">
                  <label className="form-label">Email Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                {/* Email Body */}
                <div className="mb-3">
                  <label className="form-label">Email Body</label>
                  <textarea
                    className="form-control font-monospace"
                    rows={10}
                    value={formData.emailBody}
                    onChange={e => setFormData(prev => ({ ...prev, emailBody: e.target.value }))}
                  />
                </div>

                {/* In-App Title */}
                <div className="mb-3">
                  <label className="form-label">In-App Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.inAppTitle}
                    onChange={e => setFormData(prev => ({ ...prev, inAppTitle: e.target.value }))}
                  />
                </div>

                {/* In-App Message */}
                <div className="mb-3">
                  <label className="form-label">In-App Message</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.inAppMessage}
                    onChange={e => setFormData(prev => ({ ...prev, inAppMessage: e.target.value }))}
                  />
                </div>

                {/* Active Status */}
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    เปิดใช้งาน Template นี้
                  </label>
                </div>
              </div>

              {/* Variables Panel */}
              <div className="col-lg-4">
                <div className="card bg-light">
                  <div className="card-header">
                    <h6 className="mb-0">ตัวแปรที่ใช้ได้</h6>
                  </div>
                  <div className="card-body">
                    <p className="small text-muted">คลิกเพื่อแทรกตัวแปร</p>
                    {formData.variables.map(variable => (
                      <div key={variable} className="mb-2">
                        <code className="bg-white p-2 d-block small cursor-pointer" 
                          onClick={() => {
                            navigator.clipboard.writeText(`{{${variable}}}`);
                            alert('คัดลอกแล้ว!');
                          }}
                        >
                          {`{{${variable}}}`}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer d-flex justify-content-between">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setShowEditor(false);
                setSelectedTemplate(null);
              }}
            >
              <i className="bi bi-x"></i> ยกเลิก
            </button>
            <button 
              className="btn btn-success"
              onClick={saveTemplate}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <i className="bi bi-check"></i> บันทึก
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}