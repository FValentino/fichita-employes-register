"use server";

import { attendanceService } from "@/backend/services";
import { employeeService } from "@/backend/services";
import { AttendanceType } from "@/backend/models";

interface RecordAttendanceParams {
  employee_id: number;
  recorded_by?: number | null;
  type: AttendanceType;
  timestamp?: Date;
}

function toPlainEmployee(employee: any) {
  return {
    id: employee.id,
    name: employee.name,
    lastName: employee.lastName,
    hourlyRate: Number(employee.hourlyRate),
    weeklyHours: Number(employee.weeklyHours),
    active: employee.active,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

function toPlainAttendance(attendance: any) {
  return {
    id: attendance.id,
    employeeId: attendance.employee_id,
    recordedBy: attendance.recorded_by,
    type: attendance.type,
    timestamp: attendance.timestamp,
    createdAt: attendance.created_at,
    employee: attendance.employee ? toPlainEmployee(attendance.employee) : null,
  };
}

function toPlainAttendanceWithEmployee(attendance: any) {
  return {
    id: attendance.id,
    employeeId: attendance.employee_id,
    recordedBy: attendance.recorded_by,
    type: attendance.type,
    timestamp: attendance.timestamp,
    createdAt: attendance.created_at,
    employee: {
      id: attendance.employee?.id,
      name: attendance.employee?.name,
      lastName: attendance.employee?.lastName,
    },
  };
}

export async function getAttendances() {
  try {
    const attendances = await attendanceService.getAll();
    return { success: true, data: attendances.map(toPlainAttendanceWithEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getAttendance(id: number) {
  try {
    const attendance = await attendanceService.getById(id);
    if (!attendance) {
      return { success: false, error: "Asistencia no encontrada" };
    }
    return { success: true, data: toPlainAttendanceWithEmployee(attendance) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeAttendances(employeeId: number) {
  try {
    const attendances = await attendanceService.getByEmployee(employeeId);
    return { success: true, data: attendances.map(toPlainAttendanceWithEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getTodayAttendances() {
  try {
    const attendances = await attendanceService.getTodayAttendances();
    return { success: true, data: attendances.map(toPlainAttendanceWithEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeTodayAttendances(employeeId: number) {
  try {
    const attendances = await attendanceService.getEmployeeTodayAttendances(employeeId);
    return { success: true, data: attendances.map(toPlainAttendanceWithEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordAttendance(data: RecordAttendanceParams) {
  try {
    const attendance = await attendanceService.record(data);
    return { success: true, data: toPlainAttendanceWithEmployee(attendance) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordEntry(employeeId: number, recordedBy?: number | null) {
  return recordAttendance({
    employee_id: employeeId,
    recorded_by: recordedBy ?? null,
    type: AttendanceType.ENTRADA,
  });
}

export async function recordExit(employeeId: number, recordedBy?: number | null) {
  return recordAttendance({
    employee_id: employeeId,
    recorded_by: recordedBy ?? null,
    type: AttendanceType.SALIDA,
  });
}

export async function getAttendanceStatus() {
  try {
    const employees = await employeeService.getActive();
    const todayAttendances = await attendanceService.getTodayAttendances();

    const plainEmployees = employees.map(toPlainEmployee);
    const plainAttendances = todayAttendances.map(toPlainAttendance);

    const status = plainEmployees.map((employee: any) => {
      const employeeTodayRecords = plainAttendances.filter(
        (a: any) => a.employeeId === employee.id
      );

      const lastRecord = employeeTodayRecords.length > 0
        ? employeeTodayRecords[employeeTodayRecords.length - 1]
        : null;

      const isWorking = lastRecord?.type === AttendanceType.ENTRADA;

      return {
        employeeId: employee.id,
        name: employee.name,
        lastName: employee.lastName,
        isWorking,
        lastEntry: lastRecord?.type === AttendanceType.ENTRADA ? lastRecord.timestamp : null,
      };
    });

    status.sort((a: any, b: any) => a.lastName.localeCompare(b.lastName));

    return { success: true, data: status };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export interface AttendanceQueryFilters {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
}

export async function getAttendanceReport(
  filters: AttendanceQueryFilters = {},
  page: number = 1,
  limit: number = 10
) {
  try {
    const parsedFilters = {
      employeeId: filters.employeeId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const result = await attendanceService.getPaginated(parsedFilters, page, limit);
    return { 
      success: true, 
      data: {
        ...result,
        data: result.data.map(toPlainAttendanceWithEmployee)
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
