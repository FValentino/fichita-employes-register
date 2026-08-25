"use server";

import { revalidatePath } from "next/cache";
import { employeeService } from "@/backend/services/EmployeeService";
import { waitForDb } from "@/backend/datasource";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/guard";
import { inviteEmployeeSchema } from "@/lib/validations";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase URL or Service Role Key not configured");
  }
  return createClient(url, serviceKey);
}

export async function inviteEmployee(
  employeeId: string,
  email: string,
  password: string
) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const parsed = inviteEmployeeSchema.safeParse({ employeeId, email, password });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Check employee exists
    const employee = await employeeService.getById(employeeId);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }

    // Check if already linked
    if (employee.authUserId) {
      return { success: false, error: "Este empleado ya tiene una cuenta vinculada" };
    }

    const supabase = getSupabaseAdmin();

    // Create Supabase auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      if (
        error.code === "user_already_exists" ||
        /already (?:registered|exists)/i.test(error.message)
      ) {
        return { success: false, error: "Este email ya está registrado en el sistema" };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "No se pudo crear el usuario" };
    }

    // Link auth user to employee
    await employeeService.update(employeeId, {
      email,
      authUserId: data.user.id,
    });

    revalidatePath("/dashboard/employees");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
