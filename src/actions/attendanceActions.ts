"use server";

import { attendanceService } from "@/backend/services";
import { AttendanceType } from "@/backend/models";

interface RecordAttendanceParams {
  employee_id: number;
  recorded_by: number;
  type: AttendanceType;
  timestamp?: Date;
}

export async function getAttendances() {
  try {
    const attendances = await attendanceService.getAll();
    return { success: true, data: attendances };
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
    return { success: true, data: attendance };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeAttendances(employeeId: number) {
  try {
    const attendances = await attendanceService.getByEmployee(employeeId);
    return { success: true, data: attendances };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getTodayAttendances() {
  try {
    const attendances = await attendanceService.getTodayAttendances();
    return { success: true, data: attendances };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeTodayAttendances(employeeId: number) {
  try {
    const attendances = await attendanceService.getEmployeeTodayAttendances(employeeId);
    return { success: true, data: attendances };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordAttendance(data: RecordAttendanceParams) {
  try {
    const attendance = await attendanceService.record(data);
    return { success: true, data: attendance };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordEntry(employeeId: number, recordedBy: number) {
  return recordAttendance({
    employee_id: employeeId,
    recorded_by: recordedBy,
    type: AttendanceType.ENTRADA,
  });
}

export async function recordExit(employeeId: number, recordedBy: number) {
  return recordAttendance({
    employee_id: employeeId,
    recorded_by: recordedBy,
    type: AttendanceType.SALIDA,
  });
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
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
