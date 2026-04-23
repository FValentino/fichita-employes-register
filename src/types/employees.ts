export interface Employee {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  active: boolean;
  isWorking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDTO {
  name: string;
  lastName: string;
  hourlyRate?: number;
  weeklyHours?: number;
}

export interface UpdateEmployeeDTO {
  name?: string;
  lastName?: string;
  hourlyRate?: number;
  weeklyHours?: number;
  active?: boolean;
}
