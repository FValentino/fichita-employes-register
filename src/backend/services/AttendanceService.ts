import { Attendance, AttendanceType } from "../models";
import { attendanceRepository, employeeRepository, CreateAttendanceDTO } from "../repositories";

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
}

export const attendanceService = AttendanceService.getInstance();
