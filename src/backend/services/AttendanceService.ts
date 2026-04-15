import { Attendance, AttendanceType } from "../models";
import { attendanceRepository, employeeRepository, CreateAttendanceDTO, AttendanceFilters, PaginatedResult } from "../repositories";

export class AttendanceService {
  private static instance: AttendanceService | null = null;

  private constructor() {}

  public static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
  }

  public async getAll(): Promise<Attendance[]> {
    return attendanceRepository.findAll();
  }

  public async getById(id: number): Promise<Attendance | null> {
    return attendanceRepository.findById(id);
  }

  public async getByEmployee(employeeId: number): Promise<Attendance[]> {
    return attendanceRepository.findByEmployee(employeeId);
  }

  public async getTodayAttendances(): Promise<Attendance[]> {
    return attendanceRepository.findToday();
  }

  public async getEmployeeTodayAttendances(employeeId: number): Promise<Attendance[]> {
    return attendanceRepository.findTodayByEmployee(employeeId);
  }

  public async record(
    data: Omit<CreateAttendanceDTO, "timestamp"> & { timestamp?: Date }
  ): Promise<Attendance> {
    const employee = await employeeRepository.findById(data.employee_id);
    if (!employee) {
      throw new Error("Empleado no encontrado");
    }
    if (!employee.active) {
      throw new Error("El empleado no está activo");
    }

    const timestamp = data.timestamp || new Date();

    if (data.type === AttendanceType.ENTRADA) {
      const lastRecordToday = await attendanceRepository.findLastByEmployeeToday(data.employee_id);
      if (lastRecordToday && lastRecordToday.type === AttendanceType.ENTRADA) {
        throw new Error("Ya existe una entrada sin cerrar. Registra la salida primero.");
      }
    }

    if (data.type === AttendanceType.SALIDA) {
      const lastRecordToday = await attendanceRepository.findLastByEmployeeToday(data.employee_id);
      if (!lastRecordToday || lastRecordToday.type === AttendanceType.SALIDA) {
        throw new Error("No se puede registrar SALIDA sin una ENTRADA previa");
      }
    }

    return attendanceRepository.create({
      ...data,
      timestamp,
    });
  }

  public async recordEntry(
    employeeId: number,
    recordedBy: number,
    timestamp?: Date
  ): Promise<Attendance> {
    return this.record({
      employee_id: employeeId,
      recorded_by: recordedBy,
      type: AttendanceType.ENTRADA,
      timestamp,
    });
  }

  public async recordExit(
    employeeId: number,
    recordedBy: number,
    timestamp?: Date
  ): Promise<Attendance> {
    return this.record({
      employee_id: employeeId,
      recorded_by: recordedBy,
      type: AttendanceType.SALIDA,
      timestamp,
    });
  }

  public async getPaginated(
    filters: AttendanceFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Attendance>> {
    return attendanceRepository.findWithFilters(filters, page, limit);
  }

  public async getWeekEntries(): Promise<Attendance[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return attendanceRepository.findWeekEntries(startOfWeek, endOfWeek);
  }

  public async getByEmployeeAndDateRange(employeeId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    return attendanceRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate);
  }
}

export const attendanceService = AttendanceService.getInstance();
