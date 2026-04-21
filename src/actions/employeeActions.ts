"use server";

import { employeeService } from "@/backend/services/EmployeeService";
import { waitForDb } from "@/backend/datasource";
import { CreateEmployeeDTO, UpdateEmployeeDTO } from "@/backend/types/employees";

function toPlainAttendance(attendance: any) {
  return {
    id: attendance.id,
    employeeId: attendance.employee_id,
    recordedBy: attendance.recorded_by,
    type: attendance.type,
    timestamp: attendance.timestamp,
    createdAt: attendance.created_at,
  };
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

function formatEmployeeData(data: CreateEmployeeDTO | UpdateEmployeeDTO) {
  const capitalize = (str: string) => {
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  return {
    ...data,
    name: data.name ? capitalize(data.name) : undefined,
    lastName: data.lastName ? data.lastName.toUpperCase().trim() : undefined,
  };
}

export async function getEmployees() {
  try {
    await waitForDb();
    const employees = await employeeService.getAll();
    const plainEmployees = employees.map(toPlainEmployee);
    plainEmployees.sort((a, b) => a.lastName.localeCompare(b.lastName));
    return { success: true, data: plainEmployees };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployee(id: string) {
  try {
    await waitForDb();
    const employee = await employeeService.getById(id);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveEmployees() {
  try {
    await waitForDb();
    const employees = await employeeService.getActive();
    return { success: true, data: employees.map(toPlainEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createEmployee(data: CreateEmployeeDTO) {
  try {
    await waitForDb();
    const formattedData = formatEmployeeData(data) as CreateEmployeeDTO;
    const employee = await employeeService.create(formattedData);
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateEmployee(id: string, data: UpdateEmployeeDTO) {
  try {
    await waitForDb();
    const formattedData = formatEmployeeData(data) as UpdateEmployeeDTO;
    const employee = await employeeService.update(id, formattedData);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await waitForDb();
    const deleted = await employeeService.delete(id);
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export interface EmployeeWithTurns {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  turns: Array<{
    id: number;
    entryTime: Date | null;
    exitTime: Date | null;
    isOpen: boolean;
  }>;
  totalHours: number;
  weeklySalary: number;
  workDays: number;
}

export async function getEmployeesWithWeeklyTurns() {
  try {
    await waitForDb();
    const employees = await employeeService.getActive();
    const result: EmployeeWithTurns[] = [];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { attendanceService } = await import("@/backend/services/AttendanceService");

    for (const emp of employees) {
      const attendances = await attendanceService.getByEmployeeAndDateRange(emp.id, monday, sunday);
      const plainAttendances = attendances.map(toPlainAttendance);
      
      const entries = plainAttendances.filter((a: any) => a.type === "ENTRADA");
      const exits = plainAttendances.filter((a: any) => a.type === "SALIDA");

      const turns: Array<{
        id: number;
        entryTime: Date | null;
        exitTime: Date | null;
        isOpen: boolean;
      }> = [];

      entries.forEach((entry: any, index: number) => {
        const exit = exits.find((e: any) => new Date(e.timestamp) > new Date(entry.timestamp));
        turns.push({
          id: index,
          entryTime: entry.timestamp,
          exitTime: exit ? exit.timestamp : null,
          isOpen: !exit,
        });
      });

      let totalMinutes = 0;
      for (const turn of turns) {
        if (turn.entryTime && turn.exitTime) {
          const entry = new Date(turn.entryTime).getTime();
          const exit = new Date(turn.exitTime).getTime();
          totalMinutes += (exit - entry) / (1000 * 60);
        }
      }

      const totalHours = totalMinutes / 60;
      const weeklySalary = totalHours * Number(emp.hourlyRate);

      const uniqueDays = new Set<string>();
      turns.forEach((turn: any) => {
        if (turn.entryTime) {
          const date = new Date(turn.entryTime);
          uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        }
      });

      result.push({
        id: emp.id,
        name: emp.name,
        lastName: emp.lastName,
        hourlyRate: Number(emp.hourlyRate),
        weeklyHours: Number(emp.weeklyHours),
        turns,
        totalHours,
        weeklySalary,
        workDays: uniqueDays.size,
      });
    }

    return {
      success: true,
      data: {
        employees: result,
        weekStart: monday.toISOString(),
        weekEnd: sunday.toISOString(),
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeesWithMonthlyTurns() {
  try {
    await waitForDb();
    const employees = await employeeService.getActive();
    const result: EmployeeWithTurns[] = [];

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const { attendanceService } = await import("@/backend/services/AttendanceService");

    for (const emp of employees) {
      const attendances = await attendanceService.getByEmployeeAndDateRange(emp.id, firstDay, lastDay);
      const plainAttendances = attendances.map(toPlainAttendance);
      
      const entries = plainAttendances.filter((a: any) => a.type === "ENTRADA");
      const exits = plainAttendances.filter((a: any) => a.type === "SALIDA");

      const turns: Array<{
        id: number;
        entryTime: Date | null;
        exitTime: Date | null;
        isOpen: boolean;
      }> = [];

      entries.forEach((entry: any, index: number) => {
        const exit = exits.find((e: any) => new Date(e.timestamp) > new Date(entry.timestamp));
        turns.push({
          id: index,
          entryTime: entry.timestamp,
          exitTime: exit ? exit.timestamp : null,
          isOpen: !exit,
        });
      });

      let totalMinutes = 0;
      for (const turn of turns) {
        if (turn.entryTime && turn.exitTime) {
          const entry = new Date(turn.entryTime).getTime();
          const exit = new Date(turn.exitTime).getTime();
          totalMinutes += (exit - entry) / (1000 * 60);
        }
      }

      const totalHours = totalMinutes / 60;
      const weeklySalary = totalHours * Number(emp.hourlyRate);

      const uniqueDays = new Set<string>();
      turns.forEach((turn: any) => {
        if (turn.entryTime) {
          const date = new Date(turn.entryTime);
          uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        }
      });

      result.push({
        id: emp.id,
        name: emp.name,
        lastName: emp.lastName,
        hourlyRate: Number(emp.hourlyRate),
        weeklyHours: Number(emp.weeklyHours),
        turns,
        totalHours,
        weeklySalary,
        workDays: uniqueDays.size,
      });
    }

    return {
      success: true,
      data: {
        employees: result,
        monthStart: firstDay.toISOString(),
        monthEnd: lastDay.toISOString(),
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeesWithMonthlyTurnsForPeriod(month?: number, year?: number) {
  try {
    await waitForDb();
    const employees = await employeeService.getActive();
    const result: EmployeeWithTurns[] = [];

    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();
    
    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const { attendanceService } = await import("@/backend/services/AttendanceService");

    for (const emp of employees) {
      const attendances = await attendanceService.getByEmployeeAndDateRange(emp.id, firstDay, lastDay);
      const plainAttendances = attendances.map(toPlainAttendance);
      
      const entries = plainAttendances.filter((a: any) => a.type === "ENTRADA");
      const exits = plainAttendances.filter((a: any) => a.type === "SALIDA");

      const turns: Array<{
        id: number;
        entryTime: Date | null;
        exitTime: Date | null;
        isOpen: boolean;
      }> = [];

      entries.forEach((entry: any, index: number) => {
        const exit = exits.find((e: any) => new Date(e.timestamp) > new Date(entry.timestamp));
        turns.push({
          id: index,
          entryTime: entry.timestamp,
          exitTime: exit ? exit.timestamp : null,
          isOpen: !exit,
        });
      });

      let totalMinutes = 0;
      for (const turn of turns) {
        if (turn.entryTime && turn.exitTime) {
          const entry = new Date(turn.entryTime).getTime();
          const exit = new Date(turn.exitTime).getTime();
          totalMinutes += (exit - entry) / (1000 * 60);
        }
      }

      const totalHours = totalMinutes / 60;
      const weeklySalary = totalHours * Number(emp.hourlyRate);

      const uniqueDays = new Set<string>();
      turns.forEach((turn: any) => {
        if (turn.entryTime) {
          const date = new Date(turn.entryTime);
          uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        }
      });

      result.push({
        id: emp.id,
        name: emp.name,
        lastName: emp.lastName,
        hourlyRate: Number(emp.hourlyRate),
        weeklyHours: Number(emp.weeklyHours),
        turns,
        totalHours,
        weeklySalary,
        workDays: uniqueDays.size,
      });
    }

    return {
      success: true,
      data: {
        employees: result,
        monthStart: firstDay.toISOString(),
        monthEnd: lastDay.toISOString(),
      }
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
