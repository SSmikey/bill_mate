'use client';

import { useState, useEffect } from 'react';
import RoomForm from '@/app/components/RoomForm';

// Interface สำหรับข้อมูลห้อง
interface Room {
  _id: string;
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
  isOccupied: boolean;
  tenantId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Interface สำหรับข้อมูลฟอร์ม
interface RoomFormData {
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
}

// Type สำหรับ filter
type FilterType = 'all' | 'available' | 'occupied';

export default function AdminRoomsPage() {
  // State สำหรับเก็บข้อมูล
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  // โหลดข้อมูลห้องทั้งหมดเมื่อเปิดหน้า
  useEffect(() => {
    fetchRooms();
  }, []);

  // อัปเดต filteredRooms เมื่อ rooms หรือ filter เปลี่ยน
  useEffect(() => {
    filterRooms(filter);
  }, [rooms, filter]);

  // ฟังก์ชันดึงข้อมูลห้องจาก API
  const fetchRooms = async () => {
    try {
      setPageLoading(true);
      setError('');

      const response = await fetch('/api/rooms');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลห้องได้');
      }

      setRooms(result.data || []);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setPageLoading(false);
    }
  };

  // ฟังก์ชันกรองห้องตามสถานะ
  const filterRooms = (status: FilterType) => {
    if (status === 'all') {
      setFilteredRooms(rooms);
    } else if (status === 'available') {
      setFilteredRooms(rooms.filter((r) => !r.isOccupied));
    } else {
      setFilteredRooms(rooms.filter((r) => r.isOccupied));
    }
    setFilter(status);
  };

  // ฟังก์ชันสร้างห้องใหม่
  const handleCreate = async (formData: RoomFormData) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถสร้างห้องได้');
      }

      // รีเฟรชรายการและปิดฟอร์ม
      await fetchRooms();
      setShowForm(false);
    } catch (err: any) {
      console.error('Error creating room:', err);
      throw err; // ส่งต่อให้ RoomForm จัดการ
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันแก้ไขห้อง
  const handleEdit = async (formData: RoomFormData) => {
    if (!editingRoom) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/rooms/${editingRoom._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถแก้ไขห้องได้');
      }

      // รีเฟรชรายการและปิดฟอร์ม
      await fetchRooms();
      setEditingRoom(null);
      setShowForm(false);
    } catch (err: any) {
      console.error('Error updating room:', err);
      throw err; // ส่งต่อให้ RoomForm จัดการ
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันลบห้อง
  const handleDelete = async (roomId: string, roomNumber: string) => {
    const confirmed = window.confirm(
      `ต้องการลบห้อง ${roomNumber} ใช่หรือไม่?\n\nการลบจะไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    try {
      setError('');

      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ไม่สามารถลบห้องได้');
      }

      // รีเฟรชรายการ
      await fetchRooms();
    } catch (err: any) {
      console.error('Error deleting room:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบห้อง');
    }
  };

  // ฟังก์ชันเปิดฟอร์มสร้างใหม่
  const handleAddNew = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  // ฟังก์ชันเปิดฟอร์มแก้ไข
  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  // นับจำนวนห้องแต่ละประเภท
  const availableCount = rooms.filter((r) => !r.isOccupied).length;
  const occupiedCount = rooms.filter((r) => r.isOccupied).length;

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="bi bi-house me-2"></i>
              จัดการห้องพัก
            </h2>
            <button
              className="btn btn-primary"
              onClick={handleAddNew}
              disabled={showForm}
            >
              <i className="bi bi-plus-lg me-2"></i>
              เพิ่มห้องใหม่
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError('')}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Form Section (แสดง/ซ่อน) */}
          {showForm && (
            <div className="mb-4">
              <RoomForm
                initialData={editingRoom || undefined}
                onSubmit={editingRoom ? handleEdit : handleCreate}
                isLoading={loading}
                isEditing={!!editingRoom}
              />
              <button
                className="btn btn-outline-secondary mt-2"
                onClick={() => {
                  setShowForm(false);
                  setEditingRoom(null);
                }}
              >
                <i className="bi bi-x-lg me-2"></i>
                ยกเลิก
              </button>
            </div>
          )}

          {/* Filter Badges */}
          <div className="mb-3">
            <span
              className={`badge ${
                filter === 'all' ? 'bg-primary' : 'bg-secondary'
              } me-2`}
              onClick={() => filterRooms('all')}
              style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
            >
              ทั้งหมด ({rooms.length})
            </span>
            <span
              className={`badge ${
                filter === 'available' ? 'bg-success' : 'bg-secondary'
              } me-2`}
              onClick={() => filterRooms('available')}
              style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
            >
              ห้องว่าง ({availableCount})
            </span>
            <span
              className={`badge ${
                filter === 'occupied' ? 'bg-warning' : 'bg-secondary'
              }`}
              onClick={() => filterRooms('occupied')}
              style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
            >
              มีผู้เช่า ({occupiedCount})
            </span>
          </div>

          {/* Loading State */}
          {pageLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">กำลังโหลด...</span>
              </div>
              <p className="mt-3 text-muted">กำลังโหลดข้อมูลห้อง...</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="card">
                <div className="card-body">
                  {filteredRooms.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                      <p className="mt-3 text-muted">
                        {filter === 'all'
                          ? 'ยังไม่มีห้องในระบบ'
                          : filter === 'available'
                          ? 'ไม่มีห้องว่าง'
                          : 'ไม่มีห้องที่มีผู้เช่า'}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>หมายเลขห้อง</th>
                            <th>ชั้น</th>
                            <th className="text-end">ค่าเช่า</th>
                            <th className="text-end">ค่าน้ำ</th>
                            <th className="text-end">ค่าไฟ/หน่วย</th>
                            <th>สถานะ/ผู้เช่า</th>
                            <th className="text-center" style={{ minWidth: '200px' }}>การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRooms.map((room) => (
                            <tr key={room._id}>
                              <td>
                                <strong>{room.roomNumber}</strong>
                              </td>
                              <td>{room.floor || '-'}</td>
                              <td className="text-end">
                                {room.rentPrice.toLocaleString('th-TH')} ฿
                              </td>
                              <td className="text-end">
                                {room.waterPrice.toLocaleString('th-TH')} ฿
                              </td>
                              <td className="text-end">
                                {room.electricityPrice.toLocaleString('th-TH')} ฿
                              </td>
                              <td>
                                {room.isOccupied ? (
                                  <>
                                    <span className="badge bg-warning text-dark">
                                      มีผู้เช่า
                                    </span>
                                    {room.tenantId && (
                                      <div className="small text-muted mt-1">
                                        {room.tenantId.name}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="badge bg-success">ว่าง</span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleEditClick(room)}
                                    title="แก้ไขข้อมูลห้อง"
                                  >
                                    <i className="bi bi-pencil-square me-1"></i>
                                    แก้ไข
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(room._id, room.roomNumber)}
                                    title="ลบห้อง"
                                  >
                                    <i className="bi bi-trash-fill me-1"></i>
                                    ลบ
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

              {/* Summary */}
              {filteredRooms.length > 0 && (
                <div className="mt-3 text-muted">
                  <small>
                    แสดง {filteredRooms.length} ห้อง จากทั้งหมด {rooms.length} ห้อง
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}