"use server";

import { revalidatePath } from "next/cache";
import { attendanceService } from "@/backend/services/AttendanceService";
import { employeeService } from "@/backend/services/EmployeeService";
import { waitForDb } from "@/backend/datasource";
import { AttendanceType } from "@/backend/models/Attendance";
import type { Attendance, AttendanceWithEmployee, EmployeeBasic, AttendanceStatus, DashboardStats, Turn } from "@/types/attendance";

export type Turno = {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
};
import type { Employee } from "@/types/employees";

interface RecordAttendanceParams {
  employeeId: string;
  recordedById?: string | null;
  type: AttendanceType;
  timestamp?: Date;
}

function toPlainEmployee(employee: any): EmployeeBasic {
  return {
    id: employee.id,
    name: employee.name,
    lastName: employee.lastName,
    hourlyRate: Number(employee.hourlyRate),
    isWorking: employee.isWorking,
  };
}

function toPlainAttendance(attendance: any): Attendance {
  return {
    id: attendance.id,
    employeeId: attendance.employee_id,
    type: attendance.type,
    timestamp: attendance.timestamp,
    createdAt: attendance.created_at,
  };
}

function toPlainAttendanceWithEmployee(attendance: any): AttendanceWithEmployee {
  return {
    id: attendance.id,
    employeeId: attendance.employee_id,
    type: attendance.type,
    timestamp: attendance.timestamp,
    createdAt: attendance.created_at,
    employee: {
      id: attendance.employee?.id,
      name: attendance.employee?.name,
      lastName: attendance.employee?.lastName,
      hourlyRate: Number(attendance.employee?.hourlyRate),
    },
  };
}

export async function getAttendances(): Promise<{ success: boolean; data?: AttendanceWithEmployee[]; error?: string }> {
  try {
    await waitForDb();
    const attendances = await attendanceService.getAll();
    return { success: true, data: attendances.map(toPlainAttendanceWithEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getAttendance(id: string): Promise<{ success: boolean; data?: AttendanceWithEmployee; error?: string }> {
  try {
    await waitForDb();
    const attendance = await attendanceService.getById(id);
    if (!attendance) {
      return { success: false, error: "Asistencia no encontrada" };
    }
    return { success: true, data: toPlainAttendanceWithEmployee(attendance) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeAttendances(employeeId: string): Promise<{ success: boolean; data?: Attendance[]; error?: string }> {
  try {
    await waitForDb();
    const attendances = await attendanceService.getByEmployee(employeeId);
    return { success: true, data: attendances.map(toPlainAttendance) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getTodayAttendances(): Promise<{ success: boolean; data?: Attendance[]; error?: string }> {
  try {
    await waitForDb();
    const attendances = await attendanceService.getTodayAttendances();
    return { success: true, data: attendances.map(toPlainAttendance) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeTodayAttendances(employeeId: string): Promise<{ success: boolean; data?: Attendance[]; error?: string }> {
  try {
    await waitForDb();
    const attendances = await attendanceService.getEmployeeTodayAttendances(employeeId);
    return { success: true, data: attendances.map(toPlainAttendance) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function recordAttendance(data: RecordAttendanceParams) {
  try {
    const attendance = await attendanceService.record(data);
    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
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

export async function getAttendanceStatus(): Promise<{ success: boolean; data?: AttendanceStatus[]; error?: string }> {
  try {
    await waitForDb();
    const employees = await employeeService.getActive();
    const attendances = await attendanceService.getAll();
    
    const plainEmployees = employees.map(toPlainEmployee);
    const plainAttendances = attendances.map(toPlainAttendance);

    console.log("Empleados:", plainEmployees);
    console.log("Asistencias:", plainAttendances);

    const status: AttendanceStatus[] = plainEmployees.map((employee) => {
      const employeeRecords = plainAttendances.filter((a) => a.employeeId === employee.id);

      const lastRecord = employeeRecords.length > 0
        ? employeeRecords.reduce((latest, current) => {
            const latestTime = new Date(latest.timestamp).getTime();
            const currentTime = new Date(current.timestamp).getTime();
            return currentTime > latestTime ? current : latest;
          })
        : null;

      return {
        employeeId: employee.id,
        name: employee.name,
        lastName: employee.lastName,
        isWorking: employee.isWorking ?? false,
        lastEntry: lastRecord?.type === AttendanceType.ENTRADA ? lastRecord.timestamp : null,
      };
    });

    status.sort((a, b) => a.lastName.localeCompare(b.lastName));

    return { success: true, data: status };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    await waitForDb();
    const employees = await employeeService.getActive();
    const attendances = await attendanceService.getAll();

    const plainEmployees = employees.map(toPlainEmployee);
    const plainAttendances = attendances.map(toPlainAttendance);

    const workingEmployees = plainEmployees.filter((e) => e.isWorking === true).length;
    const entriesToday = plainAttendances.filter((a) => a.type === AttendanceType.ENTRADA).length;
    const exitsToday = plainAttendances.filter((a) => a.type === AttendanceType.SALIDA).length;

    return {
      success: true,
      data: {
        totalEmployees: plainEmployees.length,
        workingEmployees,
        entriesToday,
        exitsToday,
        tardanzasSemanales: 0,
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeWeeklyTurns(employeeId: string): Promise<{ success: boolean; data?: { turns: Turn[]; monday: string; sunday: string }; error?: string }> {
  try {
    await waitForDb();
    const employee = await employeeService.getById(employeeId);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }

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

    const entries = plainAttendances.filter((a) => a.type === AttendanceType.ENTRADA);
    const exits = plainAttendances.filter((a) => a.type === AttendanceType.SALIDA);

    const turns: Turn[] = [];
    entries.forEach((entry, index) => {
      const exit = exits.find((e) => new Date(e.timestamp) > new Date(entry.timestamp));
      turns.push({
        id: index,
        entryTime: entry.timestamp,
        exitTime: exit?.timestamp ?? null,
        isOpen: !exit,
      });
    });

    if (!turns.find((t) => t.isOpen)) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        turns.push({
          id: -1,
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
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeeMonthlyTurns(
  employeeId: string,
  month?: number,
  year?: number
): Promise<{ success: boolean; data?: { turns: Turn[]; monthStart: string; monthEnd: string }; error?: string }> {
  try {
    await waitForDb();
    const employee = await employeeService.getById(employeeId);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }

    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const attendances = await attendanceService.getByEmployeeAndDateRange(employeeId, firstDay, lastDay);
    const plainAttendances = attendances.map(toPlainAttendance);

    const entries = plainAttendances.filter((a) => a.type === AttendanceType.ENTRADA);
    const exits = plainAttendances.filter((a) => a.type === AttendanceType.SALIDA);

    const turns: Turn[] = [];
    entries.forEach((entry, index) => {
      const exit = exits.find((e) => new Date(e.timestamp) > new Date(entry.timestamp));
      turns.push({
        id: index,
        entryTime: entry.timestamp,
        exitTime: exit?.timestamp ?? null,
        isOpen: !exit,
      });
    });

    if (!turns.find((t) => t.isOpen)) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        turns.push({
          id: -1,
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
        monthStart: firstDay.toISOString(),
        monthEnd: lastDay.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getPayweekTurns(employeeId: string): Promise<{ success: boolean; data?: { turns: Turn[]; start: string; end: string }; error?: string }> {
  try {
    await waitForDb();
    const employee = await employeeService.getById(employeeId);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Monday de la semana pasada (hace 7 días desde el lunes actual)
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
    
    // Monday de esta semana
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    // Inicio: lunes anterior 10:00
    const start = new Date(lastMonday);
    start.setHours(10, 0, 0, 0);
    
    // Fin: lunes actual 7:00
    const end = new Date(thisMonday);
    end.setHours(7, 0, 0, 0);

    const attendances = await attendanceService.getByEmployeeAndDateRange(employeeId, start, end);
    const plainAttendances = attendances.map(toPlainAttendance);

    const entries = plainAttendances.filter((a) => a.type === AttendanceType.ENTRADA);
    const exits = plainAttendances.filter((a) => a.type === AttendanceType.SALIDA);

    const turns: Turn[] = [];
    entries.forEach((entry, index) => {
      const exit = exits.find((e) => new Date(e.timestamp) > new Date(entry.timestamp));
      turns.push({
        id: index,
        entryTime: entry.timestamp,
        exitTime: exit?.timestamp ?? null,
        isOpen: !exit,
      });
    });

    if (!turns.find((t) => t.isOpen)) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        turns.push({
          id: -1,
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
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}