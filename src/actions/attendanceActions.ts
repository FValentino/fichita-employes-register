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
