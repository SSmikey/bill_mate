export interface RoomData {
  id: string;
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
  isOccupied: boolean;
  tenantId?: string;
  tenantName?: string;
  tenantEmail?: string;
}

export interface CreateRoomDto {
  roomNumber: string;
  floor?: number;
  rentPrice: number;
  waterPrice: number;
  electricityPrice: number;
}

export interface UpdateRoomDto {
  roomNumber?: string;
  floor?: number;
  rentPrice?: number;
  waterPrice?: number;
  electricityPrice?: number;
  isOccupied?: boolean;
  tenantId?: string;
}
