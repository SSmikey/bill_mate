'use client';

import { useState, useEffect } from 'react';
import UserForm from '@/app/components/UserForm';

interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  roomId?: { roomNumber: string };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'admin' | 'tenant'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (formData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      fetchUsers();
      setShowForm(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('ยืนยันการลบผู้ใช้นี้?')) {
      return;
    }

    setDeleting(userId);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      fetchUsers();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
    } finally {
      setDeleting(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === 'all') return true;
    return user.role === filter;
  });

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <span className="badge bg-danger">เจ้าของหอ</span>;
    }
    return <span className="badge bg-info">ผู้เช่า</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">จัดการผู้ใช้</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          {showForm ? 'ยกเลิก' : 'เพิ่มผู้ใช้ใหม่'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light border-bottom">
            <h5 className="mb-0 fw-bold">เพิ่มผู้ใช้ใหม่</h5>
          </div>
          <div className="card-body">
            <UserForm onSubmit={handleCreateUser} />
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-3">
        <div className="btn-group" role="group">
          <input
            type="radio"
            className="btn-check"
            name="filter"
            id="filterAll"
            value="all"
            checked={filter === 'all'}
            onChange={(e) => setFilter(e.target.value as any)}
          />
          <label className="btn btn-outline-secondary" htmlFor="filterAll">
            ทั้งหมด ({users.length})
          </label>

          <input
            type="radio"
            className="btn-check"
            name="filter"
            id="filterAdmin"
            value="admin"
            checked={filter === 'admin'}
            onChange={(e) => setFilter(e.target.value as any)}
          />
          <label className="btn btn-outline-secondary" htmlFor="filterAdmin">
            เจ้าของหอ ({users.filter((u) => u.role === 'admin').length})
          </label>

          <input
            type="radio"
            className="btn-check"
            name="filter"
            id="filterTenant"
            value="tenant"
            checked={filter === 'tenant'}
            onChange={(e) => setFilter(e.target.value as any)}
          />
          <label className="btn btn-outline-secondary" htmlFor="filterTenant">
            ผู้เช่า ({users.filter((u) => u.role === 'tenant').length})
          </label>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-3 d-block mb-3"></i>
              ไม่มีผู้ใช้
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>ชื่อ</th>
                    <th>อีเมล</th>
                    <th>เบอร์โทร</th>
                    <th>ห้อง</th>
                    <th>บทบาท</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="fw-bold">{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>{user.roomId?.roomNumber || '-'}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-warning"
                            title="แก้ไข"
                            disabled
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="ลบ"
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={deleting === user._id}
                          >
                            {deleting === user._id ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
