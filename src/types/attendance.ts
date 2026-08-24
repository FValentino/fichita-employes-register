export interface Attendance {
  id: string;
  employeeId: string;
  type: AttendanceType;
  timestamp: Date;
  createdAt: Date;
  employee?: EmployeeBasic;
  deviceInfo?: {
    fingerprint?: string;
    userAgent?: string;
    verificationMethod?: "biometric" | "password";
  } | null;
}

export interface AttendanceWithEmployee extends Attendance {
  employee: EmployeeBasic;
}

export interface EmployeeBasic {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  isWorking?: boolean;
}

export enum AttendanceType {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
}

export interface AttendanceStatus {
  employeeId: string;
  name: string;
  lastName: string;
  isWorking: boolean;
  lastEntry: Date | null;
}

export interface DashboardStats {
  totalEmployees: number;
  workingEmployees: number;
  entriesToday: number;
  exitsToday: number;
  tardanzasSemanales: number;
}

export interface Turn {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

export type Turno = Turn;

export interface EmployeeWithTurns {
  employee: EmployeeBasic;
  turns: Turn[];
  totalHours: number;
  weeklySalary: number;
  workDays: number;
}

export interface ReportFilters {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedAttendanceResult {
  data: AttendanceWithEmployee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}