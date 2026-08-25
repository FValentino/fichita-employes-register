import { getSessionEmployee } from "@/lib/auth/session";
import { Employee } from "@/backend/models/Employee";

/**
 * Resolves the current session employee. Returns null when
 * unauthenticated or when the account has no linked employee.
 */
export async function requireAuth(): Promise<Employee | null> {
  return getSessionEmployee();
}

/**
 * Resolves the current session and ensures the user is an admin.
 * Returns employee (success) or null + error string (failure).
 */
export async function requireAdmin(): Promise<{
  employee: Employee | null;
  error?: string;
}> {
  const employee = await getSessionEmployee();
  if (!employee) {
    return { employee: null, error: "No autenticado" };
  }
  if (employee.role !== "admin") {
    return { employee: null, error: "No autorizado" };
  }
  return { employee };
}
