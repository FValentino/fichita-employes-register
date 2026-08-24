export interface Employee {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  active: boolean;
  isWorking: boolean;
  role: "admin" | "employee";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDTO {
  name: string;
  lastName: string;
  hourlyRate?: number;
  weeklyHours?: number;
  role?: "admin" | "employee";
}

export interface UpdateEmployeeDTO {
  name?: string;
  lastName?: string;
  hourlyRate?: number;
  weeklyHours?: number;
  active?: boolean;
  role?: "admin" | "employee";
}
