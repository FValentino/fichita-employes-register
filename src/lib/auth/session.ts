import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Employee } from "@/backend/models/Employee";
import { employeeRepository } from "@/backend/repositories/EmployeeRepository";

/**
 * Server-side Supabase session resolution.
 *
 * The middleware only checks cookie presence — it never verifies the
 * token. Every endpoint and server action in scope MUST resolve identity
 * through this module instead of trusting client-supplied ids.
 *
 * The cookie adapter is deliberately READ-ONLY: resolving a session never
 * mutates Supabase auth cookies.
 */

export interface SessionUser {
  /** Supabase auth user id (auth.users.id), NOT the employee id. */
  authUserId: string;
}

async function createSessionSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Intentional no-op: sessions are resolved, never refreshed here.
      setAll: () => {},
    },
  });
}

/** Returns the verified authenticated user, or null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSessionSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return { authUserId: data.user.id };
  } catch {
    return null;
  }
}

/**
 * Resolves the Employee linked to the current session via `authUserId`.
 * Returns null when unauthenticated OR when the account has no linked
 * employee record (callers surface `account_not_linked`).
 */
export async function getSessionEmployee(): Promise<Employee | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return null;
  }
  return employeeRepository.findByAuthUserId(sessionUser.authUserId);
}
