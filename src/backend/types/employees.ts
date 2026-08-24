export interface Employee {
  id: number;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  active: boolean;
  email: string | null;
  authUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDTO {
  name: string;
  lastName: string;
  hourlyRate?: number;
  weeklyHours?: number;
  email?: string;
}

export interface UpdateEmployeeDTO {
  name?: string;
  lastName?: string;
  hourlyRate?: number;
  weeklyHours?: number;
  active?: boolean;
  email?: string;
  authUserId?: string;
}
