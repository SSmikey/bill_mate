'use client';

import { useState, useEffect } from 'react';
import RoomForm from '@/app/components/RoomForm';
import RoomAssignmentForm from '@/app/components/RoomAssignmentForm';

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

// Type สำหรับ sort
type SortField = 'roomNumber' | 'floor' | 'rentPrice';
type SortOrder = 'asc' | 'desc';

export default function AdminRoomsPage() {
  // State สำหรับเก็บข้อมูล
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [assigningRoom, setAssigningRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State สำหรับการค้นหาและเรียงลำดับ
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 999999 });
  const [floorFilter, setFloorFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('roomNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // State สำหรับ bulk operations
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // โหลดข้อมูลห้องทั้งหมดเมื่อเปิดหน้า
  useEffect(() => {
    fetchRooms();
  }, []);

  // อัปเดต filteredRooms เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    applyFiltersAndSort();
  }, [rooms, filter, searchQuery, priceRange, floorFilter, sortField, sortOrder]);

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

  // ฟังก์ชันกรองและเรียงลำดับห้อง
  const applyFiltersAndSort = () => {
    let filtered = [...rooms];

    // Filter by occupancy status
    if (filter === 'available') {
      filtered = filtered.filter((r) => !r.isOccupied);
    } else if (filter === 'occupied') {
      filtered = filtered.filter((r) => r.isOccupied);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(query) ||
          r.tenantId?.name.toLowerCase().includes(query) ||
          r.tenantId?.email.toLowerCase().includes(query)
      );
    }

    // Filter by price range
    filtered = filtered.filter(
      (r) => r.rentPrice >= priceRange.min && r.rentPrice <= priceRange.max
    );

    // Filter by floor
    if (floorFilter !== 'all') {
      filtered = filtered.filter((r) => r.floor === floorFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'roomNumber') {
        aVal = a.roomNumber.toLowerCase();
        bVal = b.roomNumber.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredRooms(filtered);
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

      await fetchRooms();
      setShowForm(false);
      setSuccess('เพิ่มห้องใหม่สำเร็จ');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error creating room:', err);
      throw err;
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

      await fetchRooms();
      setEditingRoom(null);
      setShowForm(false);
      setSuccess('แก้ไขข้อมูลห้องสำเร็จ');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating room:', err);
      throw err;
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

      await fetchRooms();
      setSuccess(`ลบห้อง ${roomNumber} สำเร็จ`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting room:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการลบห้อง');
    }
  };

  // ฟังก์ชัน bulk delete
  const handleBulkDelete = async () => {
    if (selectedRooms.length === 0) return;

    const confirmed = window.confirm(
      `ต้องการลบห้องที่เลือก ${selectedRooms.length} ห้อง ใช่หรือไม่?\n\nการลบจะไม่สามารถย้อนกลับได้`
    );

    if (!confirmed) return;

    try {
      setError('');
      setLoading(true);

      const deletePromises = selectedRooms.map((roomId) =>
        fetch(`/api/rooms/${roomId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      await fetchRooms();
      setSelectedRooms([]);
      setBulkMode(false);
      setSuccess(`ลบห้อง ${selectedRooms.length} ห้องสำเร็จ`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error bulk deleting rooms:', err);
      setError('เกิดข้อผิดพลาดในการลบห้อง');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเปิดฟอร์ม Assign
  const handleAssignClick = (room: Room) => {
    setAssigningRoom(room);
    setShowAssignForm(true);
  };

  // ฟังก์ชันหลัง Assign สำเร็จ
  const handleAssignSuccess = () => {
    fetchRooms();
    setShowAssignForm(false);
    setAssigningRoom(null);
    setSuccess('มอบหมายห้องสำเร็จ');
    setTimeout(() => setSuccess(''), 3000);
  };

  // ฟังก์ชัน Export to CSV
  const handleExportCSV = () => {
    const headers = ['หมายเลขห้อง', 'ชั้น', 'ค่าเช่า', 'ค่าน้ำ', 'ค่าไฟ/หน่วย', 'สถานะ', 'ผู้เช่า'];
    const rows = filteredRooms.map((r) => [
      r.roomNumber,
      r.floor || '-',
      r.rentPrice,
      r.waterPrice,
      r.electricityPrice,
      r.isOccupied ? 'มีผู้เช่า' : 'ว่าง',
      r.tenantId?.name || '-',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rooms_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Toggle bulk mode
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedRooms([]);
  };

  // Toggle room selection
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  // Select all rooms
  const selectAllRooms = () => {
    if (selectedRooms.length === filteredRooms.length) {
      setSelectedRooms([]);
    } else {
      setSelectedRooms(filteredRooms.map((r) => r._id));
    }
  };

  // Get unique floors
  const uniqueFloors = Array.from(new Set(rooms.map((r) => r.floor).filter((f) => f !== undefined)));

  // นับจำนวนห้องแต่ละประเภท
  const availableCount = rooms.filter((r) => !r.isOccupied).length;
  const occupiedCount = rooms.filter((r) => r.isOccupied).length;

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>
                <i className="bi bi-house me-2"></i>
                จัดการห้องพัก
              </h2>
              <small className="text-muted">
                ทั้งหมด {rooms.length} ห้อง | แสดง {filteredRooms.length} ห้อง
              </small>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={handleExportCSV}
                disabled={filteredRooms.length === 0}
              >
                <i className="bi bi-download me-2"></i>
                Export CSV
              </button>
              <button
                className={`btn ${bulkMode ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={toggleBulkMode}
              >
                <i className="bi bi-check-square me-2"></i>
                {bulkMode ? 'ยกเลิกโหมดเลือก' : 'เลือกหลายรายการ'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingRoom(null);
                  setShowForm(true);
                }}
                disabled={showForm}
              >
                <i className="bi bi-plus-lg me-2"></i>
                เพิ่มห้องใหม่
              </button>
            </div>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              {success}
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuccess('')}
                aria-label="Close"
              ></button>
            </div>
          )}

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

          {/* Form Section */}
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

          {/* Assignment Form Section */}
          {showAssignForm && assigningRoom && (
            <div className="mb-4">
              <RoomAssignmentForm
                room={assigningRoom}
                onSuccess={handleAssignSuccess}
                onCancel={() => {
                  setShowAssignForm(false);
                  setAssigningRoom(null);
                }}
              />
            </div>
          )}

          {/* Advanced Filters */}
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3">
                {/* Search */}
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="bi bi-search me-2"></i>
                    ค้นหา
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="หมายเลขห้อง, ชื่อผู้เช่า, อีเมล"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Price Range */}
                <div className="col-md-4">
                  <label className="form-label">
                    <i className="bi bi-cash me-2"></i>
                    ช่วงราคา
                  </label>
                  <div className="d-flex gap-2">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="ต่ำสุด"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: Number(e.target.value) })
                      }
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="สูงสุด"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                {/* Floor Filter */}
                <div className="col-md-2">
                  <label className="form-label">
                    <i className="bi bi-building me-2"></i>
                    ชั้น
                  </label>
                  <select
                    className="form-select"
                    value={floorFilter}
                    onChange={(e) =>
                      setFloorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                  >
                    <option value="all">ทั้งหมด</option>
                    {uniqueFloors.sort((a, b) => a! - b!).map((floor) => (
                      <option key={floor} value={floor}>
                        ชั้น {floor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="col-md-2">
                  <label className="form-label">
                    <i className="bi bi-sort-down me-2"></i>
                    เรียงตาม
                  </label>
                  <select
                    className="form-select"
                    value={`${sortField}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortField(field as SortField);
                      setSortOrder(order as SortOrder);
                    }}
                  >
                    <option value="roomNumber-asc">หมายเลขห้อง (A-Z)</option>
                    <option value="roomNumber-desc">หมายเลขห้อง (Z-A)</option>
                    <option value="floor-asc">ชั้น (น้อย-มาก)</option>
                    <option value="floor-desc">ชั้น (มาก-น้อย)</option>
                    <option value="rentPrice-asc">ราคา (ถูก-แพง)</option>
                    <option value="rentPrice-desc">ราคา (แพง-ถูก)</option>
                  </select>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setPriceRange({ min: 0, max: 999999 });
                    setFloorFilter('all');
                    setSortField('roomNumber');
                    setSortOrder('asc');
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-2"></i>
                  รีเซ็ตตัวกรอง
                </button>
              </div>
            </div>
          </div>

          {/* Filter Badges */}
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <div>
              <span
                className={`badge ${filter === 'all' ? 'bg-primary' : 'bg-secondary'} me-2`}
                onClick={() => setFilter('all')}
                style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
              >
                ทั้งหมด ({rooms.length})
              </span>
              <span
                className={`badge ${filter === 'available' ? 'bg-success' : 'bg-secondary'} me-2`}
                onClick={() => setFilter('available')}
                style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
              >
                ห้องว่าง ({availableCount})
              </span>
              <span
                className={`badge ${filter === 'occupied' ? 'bg-warning' : 'bg-secondary'}`}
                onClick={() => setFilter('occupied')}
                style={{ cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
              >
                มีผู้เช่า ({occupiedCount})
              </span>
            </div>

            {/* Bulk Actions */}
            {bulkMode && selectedRooms.length > 0 && (
              <div>
                <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>
                  <i className="bi bi-trash-fill me-2"></i>
                  ลบที่เลือก ({selectedRooms.length})
                </button>
              </div>
            )}
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
                        {searchQuery || priceRange.min > 0 || floorFilter !== 'all'
                          ? 'ไม่พบห้องที่ตรงกับเงื่อนไขการค้นหา'
                          : filter === 'all'
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
                            {bulkMode && (
                              <th style={{ width: '50px' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={
                                    selectedRooms.length === filteredRooms.length &&
                                    filteredRooms.length > 0
                                  }
                                  onChange={selectAllRooms}
                                />
                              </th>
                            )}
                            <th>หมายเลขห้อง</th>
                            <th>ชั้น</th>
                            <th className="text-end">ค่าเช่า</th>
                            <th className="text-end">ค่าน้ำ</th>
                            <th className="text-end">ค่าไฟ/หน่วย</th>
                            <th>สถานะ/ผู้เช่า</th>
                            <th className="text-center" style={{ minWidth: '250px' }}>
                              การจัดการ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRooms.map((room) => (
                            <tr key={room._id}>
                              {bulkMode && (
                                <td>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={selectedRooms.includes(room._id)}
                                    onChange={() => toggleRoomSelection(room._id)}
                                  />
                                </td>
                              )}
                              <td>
                                <strong>{room.roomNumber}</strong>
                              </td>
                              <td>{room.floor || '-'}</td>
                              <td className="text-end">{room.rentPrice.toLocaleString('th-TH')} ฿</td>
                              <td className="text-end">{room.waterPrice.toLocaleString('th-TH')} ฿</td>
                              <td className="text-end">
                                {room.electricityPrice.toLocaleString('th-TH')} ฿
                              </td>
                              <td>
                                {room.isOccupied ? (
                                  <>
                                    <span className="badge bg-warning text-dark">มีผู้เช่า</span>
                                    {room.tenantId && (
                                      <div className="small text-muted mt-1">{room.tenantId.name}</div>
                                    )}
                                  </>
                                ) : (
                                  <span className="badge bg-success">ว่าง</span>
                                )}
                              </td>
                              <td className="text-center">
                                <div className="btn-group" role="group">
                                  {!room.isOccupied && (
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleAssignClick(room)}
                                      title="มอบหมายผู้เช่า"
                                    >
                                      <i className="bi bi-person-plus-fill me-1"></i>
                                      มอบหมาย
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                      setEditingRoom(room);
                                      setShowForm(true);
                                    }}
                                    title="แก้ไขข้อมูลห้อง"
                                  >
                                    <i className="bi bi-pencil-square me-1"></i>
                                    แก้ไข
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(room._id, room.roomNumber)}
                                    title="ลบห้อง"
                                    disabled={room.isOccupied}
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
                    {selectedRooms.length > 0 && ` | เลือก ${selectedRooms.length} ห้อง`}
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