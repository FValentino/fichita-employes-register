"use server";

import { revalidatePath } from "next/cache";
import { employeeTurnService } from "@/backend/services/EmployeeTurnService";
import { waitForDb } from "@/backend/datasource";
import { requireAuth, requireAdmin } from "@/lib/auth/guard";
import { bulkCreateTurnsSchema } from "@/lib/validations";

import { EmployeeTurn } from "@/backend/models/EmployeeTurn";

function toPlainTurn(turn: EmployeeTurn) {
  return {
    id: turn.id,
    employeeId: turn.employeeId,
    dayOfWeek: turn.dayOfWeek,
    entryTime: turn.entryTime,
    exitTime: turn.exitTime,
    active: turn.active,
    createdAt: turn.createdAt,
    updatedAt: turn.updatedAt,
  };
}

export async function getEmployeeTurns(employeeId: string) {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const turns = await employeeTurnService.getByEmployee(employeeId);
    return { success: true, data: turns.map(toPlainTurn) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function saveEmployeeTurns(data: unknown) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const parsed = bulkCreateTurnsSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await employeeTurnService.bulkUpsert(parsed.data);
    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteEmployeeTurn(id: number) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();
    const deleted = await employeeTurnService.delete(id);
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
