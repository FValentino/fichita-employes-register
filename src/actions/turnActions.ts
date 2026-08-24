"use server";

import { revalidatePath } from "next/cache";
import { employeeTurnService } from "@/backend/services/EmployeeTurnService";
import { waitForDb } from "@/backend/datasource";
import { BulkCreateTurnsDTO } from "@/backend/types/employeeTurns";

function toPlainTurn(turn: any) {
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
    await waitForDb();
    const turns = await employeeTurnService.getByEmployee(employeeId);
    return { success: true, data: turns.map(toPlainTurn) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function saveEmployeeTurns(data: BulkCreateTurnsDTO) {
  try {
    await waitForDb();
    await employeeTurnService.bulkUpsert(data);
    revalidatePath("/dashboard/employees");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteEmployeeTurn(id: number) {
  try {
    await waitForDb();
    const deleted = await employeeTurnService.delete(id);
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
