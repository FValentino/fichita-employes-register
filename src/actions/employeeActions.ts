"use server";

import { revalidatePath } from "next/cache";
import { employeeService } from "@/backend/services/EmployeeService";
import { auditLogService } from "@/backend/services/AuditLogService";
import { waitForDb } from "@/backend/datasource";
import { requireAuth, requireAdmin } from "@/lib/auth/guard";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validations";
import { Employee } from "@/backend/models/Employee";

function toPlainEmployee(employee: Employee) {
  return {
    id: employee.id,
    name: employee.name,
    lastName: employee.lastName,
    hourlyRate: Number(employee.hourlyRate),
    weeklyHours: Number(employee.weeklyHours),
    active: employee.active,
    isWorking: employee.isWorking ?? false,
    email: employee.email ?? null,
    authUserId: employee.authUserId ?? null,
    role: employee.role ?? "employee",
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

function formatEmployeeData(data: Record<string, unknown>) {
  const capitalize = (str: string) => {
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  return {
    ...data,
    name: typeof data.name === "string" ? capitalize(data.name) : undefined,
    lastName: typeof data.lastName === "string" ? data.lastName.toUpperCase().trim() : undefined,
  };
}

export async function getEmployees() {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
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
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
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

export async function getEmployeeByAuthUserId(authUserId: string) {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const { AppDataSource } = await import("@/backend/datasource");
    const { Employee } = await import("@/backend/models/Employee");
    const repo = AppDataSource.getRepository(Employee);
    const employee = await repo.findOne({ where: { authUserId } });
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
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const employees = await employeeService.getActive();
    return { success: true, data: employees.map(toPlainEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createEmployee(data: unknown) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const parsed = createEmployeeSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const formattedData = formatEmployeeData(parsed.data);
    const employee = await employeeService.create(formattedData as any);
    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard");
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateEmployee(id: string, data: unknown) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const parsed = updateEmployeeSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Get current employee data for audit log
    const currentEmployee = await employeeService.getById(id);
    if (!currentEmployee) {
      return { success: false, error: "Empleado no encontrado" };
    }

    const formattedData = formatEmployeeData(parsed.data);
    const employee = await employeeService.update(id, formattedData as any);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }

    // Log changes
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(formattedData)) {
      if (newValue !== undefined) {
        const oldValue = (currentEmployee as any)[key];
        if (String(oldValue) !== String(newValue)) {
          changes[key] = { old: oldValue, new: newValue };
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await auditLogService.log({
        entity: "employee",
        entityId: id,
        action: "update",
        changes,
      });
    }

    revalidatePath("/dashboard/employees");
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteEmployee(id: string) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();
    const deleted = await employeeService.delete(id);
    if (deleted) {
      revalidatePath("/dashboard/employees");
      revalidatePath("/dashboard");
    }
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployeesWithWeeklyTurns() {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { attendanceService } = await import("@/backend/services/AttendanceService");
    const { computeTurnsForEmployees } = await import("@/lib/turn-calculation");

    const employees = await employeeService.getActive();
    const allAttendances = await attendanceService.getByDateRange(monday, sunday);
    const result = computeTurnsForEmployees(employees, allAttendances);

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
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const { attendanceService } = await import("@/backend/services/AttendanceService");
    const { computeTurnsForEmployees } = await import("@/lib/turn-calculation");

    const employees = await employeeService.getActive();
    const allAttendances = await attendanceService.getByDateRange(firstDay, lastDay);
    const result = computeTurnsForEmployees(employees, allAttendances);

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
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();

    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const { attendanceService } = await import("@/backend/services/AttendanceService");
    const { computeTurnsForEmployees } = await import("@/lib/turn-calculation");

    const employees = await employeeService.getActive();
    const allAttendances = await attendanceService.getByDateRange(firstDay, lastDay);
    const result = computeTurnsForEmployees(employees, allAttendances);

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
