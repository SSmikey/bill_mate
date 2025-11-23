import { ObjectId } from 'mongodb';
import type {
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
} from '@/types/maintenance';

/**
 * Maintenance Model
 * เก็บข้อมูลการแจ้งซ่อมและบำรุงรักษาห้องพัก
 */

export interface IMaintenanceDocument {
  _id?: ObjectId;
  roomId: ObjectId; // Reference to Room
  tenantId?: ObjectId; // Reference to User (tenant) - optional if admin creates
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  assignedTo?: string; // ชื่อช่างหรือผู้รับผิดชอบ
  notes?: string;
  images?: string[]; // URLs or paths to images
  createdBy: {
    userId: ObjectId;
    name: string;
    role: 'admin' | 'tenant';
  };
  createdAt: Date;
  updatedAt: Date;
}

export class MaintenanceModel {
  /**
   * Validate maintenance data
   */
  static validate(data: Partial<IMaintenanceDocument>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields
    if (!data.roomId) {
      errors.push('กรุณาระบุห้องพัก');
    }

    if (!data.category) {
      errors.push('กรุณาระบุหมวดหมู่การซ่อม');
    }

    if (!data.title || data.title.trim().length === 0) {
      errors.push('กรุณาระบุหัวข้อ');
    }

    if (data.title && data.title.length > 200) {
      errors.push('หัวข้อต้องไม่เกิน 200 ตัวอักษร');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('กรุณาระบุรายละเอียด');
    }

    if (data.description && data.description.length > 2000) {
      errors.push('รายละเอียดต้องไม่เกิน 2000 ตัวอักษร');
    }

    if (!data.priority) {
      errors.push('กรุณาระบุระดับความสำคัญ');
    }

    // Validate category
    const validCategories: MaintenanceCategory[] = [
      'electrical',
      'plumbing',
      'air-conditioning',
      'furniture',
      'cleaning',
      'security',
      'other',
    ];

    if (data.category && !validCategories.includes(data.category)) {
      errors.push('หมวดหมู่ไม่ถูกต้อง');
    }

    // Validate priority
    const validPriorities: MaintenancePriority[] = ['low', 'medium', 'high', 'urgent'];

    if (data.priority && !validPriorities.includes(data.priority)) {
      errors.push('ระดับความสำคัญไม่ถูกต้อง');
    }

    // Validate status
    const validStatuses: MaintenanceStatus[] = [
      'pending',
      'in-progress',
      'completed',
      'cancelled',
    ];

    if (data.status && !validStatuses.includes(data.status)) {
      errors.push('สถานะไม่ถูกต้อง');
    }

    // Validate cost
    if (data.cost !== undefined && data.cost < 0) {
      errors.push('ค่าใช้จ่ายต้องไม่ติดลบ');
    }

    if (data.cost !== undefined && data.cost > 1000000) {
      errors.push('ค่าใช้จ่ายต้องไม่เกิน 1,000,000 บาท');
    }

    // Validate dates
    if (data.scheduledDate && data.reportedDate) {
      const scheduled = new Date(data.scheduledDate);
      const reported = new Date(data.reportedDate);

      if (scheduled < reported) {
        errors.push('วันที่นัดหมายต้องไม่น้อยกว่าวันที่แจ้ง');
      }
    }

    if (data.completedDate && data.reportedDate) {
      const completed = new Date(data.completedDate);
      const reported = new Date(data.reportedDate);

      if (completed < reported) {
        errors.push('วันที่เสร็จสิ้นต้องไม่น้อยกว่าวันที่แจ้ง');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create default maintenance document
   */
  static createDefault(
    roomId: ObjectId,
    createdBy: { userId: ObjectId; name: string; role: 'admin' | 'tenant' }
  ): Partial<IMaintenanceDocument> {
    return {
      roomId,
      category: 'other',
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      reportedDate: new Date(),
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate completion time in days
   */
  static calculateCompletionTime(reportedDate: Date, completedDate: Date): number {
    const diffTime = Math.abs(completedDate.getTime() - reportedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if maintenance is overdue
   */
  static isOverdue(scheduledDate?: Date, status?: MaintenanceStatus): boolean {
    if (!scheduledDate || status === 'completed' || status === 'cancelled') {
      return false;
    }

    const now = new Date();
    return new Date(scheduledDate) < now;
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: MaintenanceStatus): string {
    const colors: Record<MaintenanceStatus, string> = {
      pending: 'warning',
      'in-progress': 'info',
      completed: 'success',
      cancelled: 'secondary',
    };

    return colors[status] || 'secondary';
  }

  /**
   * Get priority color for UI
   */
  static getPriorityColor(priority: MaintenancePriority): string {
    const colors: Record<MaintenancePriority, string> = {
      low: 'secondary',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    };

    return colors[priority] || 'secondary';
  }

  /**
   * Format status for display
   */
  static formatStatus(status: MaintenanceStatus): string {
    const labels: Record<MaintenanceStatus, string> = {
      pending: 'รอดำเนินการ',
      'in-progress': 'กำลังดำเนินการ',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    };

    return labels[status] || status;
  }

  /**
   * Format priority for display
   */
  static formatPriority(priority: MaintenancePriority): string {
    const labels: Record<MaintenancePriority, string> = {
      low: 'ต่ำ',
      medium: 'ปานกลาง',
      high: 'สูง',
      urgent: 'เร่งด่วน',
    };

    return labels[priority] || priority;
  }

  /**
   * Format category for display
   */
  static formatCategory(category: MaintenanceCategory): string {
    const labels: Record<MaintenanceCategory, string> = {
      electrical: 'ระบบไฟฟ้า',
      plumbing: 'ระบบประปา',
      'air-conditioning': 'เครื่องปรับอากาศ',
      furniture: 'เฟอร์นิเจอร์',
      cleaning: 'ทำความสะอาด',
      security: 'ระบบรักษาความปลอดภัย',
      other: 'อื่นๆ',
    };

    return labels[category] || category;
  }
}

export default MaintenanceModel;