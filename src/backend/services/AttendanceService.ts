import { Attendance, AttendanceType } from "../models/Attendance";
import { attendanceRepository,  CreateAttendanceDTO, AttendanceFilters, PaginatedResult } from "../repositories/AttendanceRepository";
import { employeeRepository } from "../repositories/EmployeeRepository";

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

  public async getById(id: string): Promise<Attendance | null> {
    return attendanceRepository.findById(id);
  }

  public async getByEmployee(employeeId: string): Promise<Attendance[]> {
    return attendanceRepository.findByEmployee(employeeId);
  }

  public async getEmployeeTodayAttendances(employeeId: string): Promise<Attendance[]> {
    return attendanceRepository.findTodayByEmployee(employeeId);
  }

  public async getTodayAttendances(): Promise<Attendance[]> {
    return attendanceRepository.findToday();
  }

  public async record(
    data: Omit<CreateAttendanceDTO, "timestamp"> & { timestamp?: Date }
  ): Promise<Attendance> {
    const employee = await employeeRepository.findById(data.employeeId);
    if (!employee) {
      throw new Error("Empleado no encontrado");
    }
    if (!employee.active) {
      throw new Error("El empleado no está activo");
    }

    const timestamp = data.timestamp || new Date();

    if (data.type === AttendanceType.ENTRADA) {
      const lastRecord = await attendanceRepository.findLastByEmployee(data.employeeId);
      if (lastRecord && lastRecord.type === AttendanceType.ENTRADA) {
        throw new Error("Ya existe una entrada sin cerrar. Registra la salida primero.");
      }
      // Actualizar isWorking a true
      await employeeRepository.updateIsWorking(data.employeeId, true);
    }

    if (data.type === AttendanceType.SALIDA) {
      const lastRecord = await attendanceRepository.findLastByEmployee(data.employeeId);
      if (!lastRecord || lastRecord.type === AttendanceType.SALIDA) {
        throw new Error("No se puede registrar SALIDA sin una ENTRADA previa");
      }
      // Actualizar isWorking a false
      await employeeRepository.updateIsWorking(data.employeeId, false);
    }

    return attendanceRepository.create({
      ...data,
      timestamp,
    });
  }

  public async recordEntry(
    employeeId: string,
    timestamp?: Date
  ): Promise<Attendance> {
    return this.record({
      employeeId,
      type: AttendanceType.ENTRADA,
      timestamp,
    });
  }

  public async recordExit(
    employeeId: string,
    timestamp?: Date
  ): Promise<Attendance> {
    return this.record({
      employeeId,
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

  public async getByEmployeeAndDateRange(employeeId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    return attendanceRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate);
  }
}

export const attendanceService = AttendanceService.getInstance();