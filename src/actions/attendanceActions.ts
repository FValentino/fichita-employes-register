"use server";

import { attendanceService } from "@/backend/services/AttendanceService";
import { employeeService } from "@/backend/services/EmployeeService";
import { waitForDb } from "@/backend/datasource";
import { AttendanceType } from "@/backend/models/Attendance";

interface RecordAttendanceParams {
  employeeId: string;
  recordedById?: string | null;
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

export async function getAttendance(id: string) {
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

export async function getEmployeeAttendances(employeeId: string) {
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

export async function getEmployeeTodayAttendances(employeeId: string) {
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

export async function recordEntry(employeeId: string, recordedBy?: string | null) {
  return recordAttendance({
    employeeId,
    recordedById: recordedBy ?? null,
    type: AttendanceType.ENTRADA,
  });
}

export async function recordExit(employeeId: string, recordedBy?: string | null) {
  return recordAttendance({
    employeeId,
    recordedById: recordedBy ?? null,
    type: AttendanceType.SALIDA,
  });
}

export async function getAttendanceStatus() {
  try {
    await waitForDb();
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
  employeeId?: string;
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

export async function getDashboardStats() {
  try {
    await waitForDb();
    const allEmployees = await employeeService.getAll();
    const activeEmployees = await employeeService.getActive();
    const todayAttendances = await attendanceService.getTodayAttendances();

    const plainAttendances = todayAttendances.map(toPlainAttendance);
    const plainActiveEmployees = activeEmployees.map(toPlainEmployee);

    const workingEmployees = plainActiveEmployees.filter((employee: any) => {
      const employeeRecords = plainAttendances.filter((a: any) => a.employeeId === employee.id);
      const lastRecord = employeeRecords[employeeRecords.length - 1];
      return lastRecord?.type === AttendanceType.ENTRADA;
    });

    const entriesToday = plainAttendances.filter((a: any) => a.type === AttendanceType.ENTRADA).length;
    const exitsToday = plainAttendances.filter((a: any) => a.type === AttendanceType.SALIDA).length;

    const weekTardanzas = await attendanceService.getWeekEntries();
    const TARDANZA_HOUR = 9;
    const tardanzasSemanales = weekTardanzas.filter((entry: any) => {
      const entryHour = new Date(entry.timestamp).getHours();
      return entryHour > TARDANZA_HOUR;
    }).length;

    return {
      success: true,
      data: {
        totalEmployees: allEmployees.length,
        workingEmployees: workingEmployees.length,
        entriesToday,
        exitsToday,
        tardanzasSemanales,
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export interface Turno {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

export async function getEmployeeWeeklyTurns(employeeId: string) {
  try {
    await waitForDb();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const attendances = await attendanceService.getByEmployeeAndDateRange(employeeId, monday, sunday);

    const plainAttendances = attendances.map(toPlainAttendance);

    const entries = plainAttendances.filter((a: any) => a.type === "ENTRADA");
    const exits = plainAttendances.filter((a: any) => a.type === "SALIDA");

    const turns: any[] = [];

    entries.forEach((entry: any, index: number) => {
      const exit = exits.find((e: any) => new Date(e.timestamp) > new Date(entry.timestamp));
      turns.push({
        id: index,
        entryTime: entry.timestamp,
        exitTime: exit ? exit.timestamp : null,
        isOpen: !exit,
      });
    });

    const lastEntry = entries[entries.length - 1];
    const lastExit = exits[exits.length - 1];
    if (!lastExit || (lastEntry && new Date(lastEntry.timestamp) > new Date(lastExit.timestamp))) {
      if (!turns.find((t: any) => t.isOpen)) {
        turns.push({
          id: turns.length,
          entryTime: lastEntry.timestamp,
          exitTime: null,
          isOpen: true,
        });
      }
    }

    return {
      success: true,
      data: {
        turns,
        monday: monday.toISOString(),
        sunday: sunday.toISOString(),
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeMonthlyTurns(employeeId: string, month?: number, year?: number) {
  try {
    await waitForDb();
    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();
    
    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const attendances = await attendanceService.getByEmployeeAndDateRange(employeeId, firstDay, lastDay);

    const plainAttendances = attendances.map(toPlainAttendance);

    const entries = plainAttendances.filter((a: any) => a.type === "ENTRADA");
    const exits = plainAttendances.filter((a: any) => a.type === "SALIDA");

    const turns: any[] = [];

    entries.forEach((entry: any, index: number) => {
      const exit = exits.find((e: any) => new Date(e.timestamp) > new Date(entry.timestamp));
      turns.push({
        id: index,
        entryTime: entry.timestamp,
        exitTime: exit ? exit.timestamp : null,
        isOpen: !exit,
      });
    });

    const lastEntry = entries[entries.length - 1];
    const lastExit = exits[exits.length - 1];
    if (!lastExit || (lastEntry && new Date(lastEntry.timestamp) > new Date(lastExit.timestamp))) {
      if (!turns.find((t: any) => t.isOpen)) {
        turns.push({
          id: turns.length,
          entryTime: lastEntry.timestamp,
          exitTime: null,
          isOpen: true,
        });
      }
    }

    return {
      success: true,
      data: {
        turns,
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString(),
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
