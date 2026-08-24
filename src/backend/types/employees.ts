import { UserRole } from "../models/Employee";

export interface Employee {
  id: number;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  active: boolean;
  email: string | null;
  authUserId: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDTO {
  name: string;
  lastName: string;
  hourlyRate?: number;
  weeklyHours?: number;
  email?: string;
  role?: UserRole;
}

export interface UpdateEmployeeDTO {
  name?: string;
  lastName?: string;
  hourlyRate?: number;
  weeklyHours?: number;
  active?: boolean;
  email?: string;
  authUserId?: string;
  role?: UserRole;
}
