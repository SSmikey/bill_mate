export type BillStatus = 'pending' | 'paid' | 'overdue' | 'verified';

export interface BillData {
  id: string;
  roomId: string;
  tenantId: string;
  roomNumber?: string;
  tenantName?: string;
  month: number;
  year: number;
  rentAmount: number;
  waterAmount: number;
  electricityAmount: number;
  totalAmount: number;
  dueDate: Date;
  status: BillStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillDto {
  roomId: string;
  tenantId: string;
  month: number;
  year: number;
  rentAmount: number;
  waterAmount: number;
  electricityAmount: number;
  dueDate: Date;
}

export interface UpdateBillDto {
  status?: BillStatus;
  rentAmount?: number;
  waterAmount?: number;
  electricityAmount?: number;
  dueDate?: Date;
}

export interface GenerateBillsDto {
  month: number;
  year: number;
  dueDay: number;
}
