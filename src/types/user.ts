export type UserRole = 'admin' | 'tenant';

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  roomId?: string;
  roomNumber?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  roomId?: string;
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  roomId?: string;
}
