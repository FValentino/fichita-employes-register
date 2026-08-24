export interface EmployeeTurn {
  id: number;
  employeeId: string;
  dayOfWeek: number;
  entryTime: string | null;
  exitTime: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeTurnDTO {
  employeeId: string;
  dayOfWeek: number;
  entryTime?: string | null;
  exitTime?: string | null;
}

export interface UpdateEmployeeTurnDTO {
  entryTime?: string | null;
  exitTime?: string | null;
  active?: boolean;
}

export interface BulkCreateTurnsDTO {
  employeeId: string;
  turns: Array<{
    dayOfWeek: number;
    entryTime: string | null;
    exitTime: string | null;
  }>;
}
