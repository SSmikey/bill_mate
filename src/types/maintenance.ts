export type MaintenanceStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceCategory =
  | 'electrical'
  | 'plumbing'
  | 'air-conditioning'
  | 'furniture'
  | 'cleaning'
  | 'security'
  | 'other';

export interface MaintenanceRequest {
  _id: string;
  roomId: {
    _id: string;
    roomNumber: string;
    floor?: number;
  };
  tenantId?: {
    _id: string;
    name: string;
    email: string;
  };
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: Date | string;
  scheduledDate?: Date | string;
  completedDate?: Date | string;
  cost?: number;
  assignedTo?: string; // Name of technician/person assigned
  notes?: string;
  images?: string[]; // URLs or base64
  createdBy: {
    _id: string;
    name: string;
    role: 'admin' | 'tenant';
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MaintenanceFormData {
  roomId: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: MaintenancePriority;
  scheduledDate?: string;
  assignedTo?: string;
  notes?: string;
}

export interface MaintenanceUpdateData {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  scheduledDate?: string;
  completedDate?: string;
  cost?: number;
  assignedTo?: string;
  notes?: string;
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalCost: number;
  avgCompletionTime: number; // in days
  byCategory: Record<MaintenanceCategory, number>;
  byPriority: Record<MaintenancePriority, number>;
}

// Helper functions for display
export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  electrical: 'ระบบไฟฟ้า',
  plumbing: 'ระบบประปา',
  'air-conditioning': 'เครื่องปรับอากาศ',
  furniture: 'เฟอร์นิเจอร์',
  cleaning: 'ทำความสะอาด',
  security: 'ระบบรักษาความปลอดภัย',
  other: 'อื่นๆ',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  pending: 'รอดำเนินการ',
  'in-progress': 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก',
};

export const MAINTENANCE_PRIORITY_LABELS: Record<MaintenancePriority, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
  urgent: 'เร่งด่วน',
};

export const MAINTENANCE_STATUS_COLORS: Record<MaintenanceStatus, string> = {
  pending: 'warning',
  'in-progress': 'info',
  completed: 'success',
  cancelled: 'secondary',
};

export const MAINTENANCE_PRIORITY_COLORS: Record<MaintenancePriority, string> = {
  low: 'secondary',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};