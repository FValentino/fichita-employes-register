"use server";

import { createClient } from "@supabase/supabase-js";
import { waitForDb } from "@/backend/datasource";
import {
  STEP_UP_INTENTS,
  type StepUpIntent,
} from "@/backend/models/WebAuthnStepUpToken";
import { webAuthnStepUpTokenRepository } from "@/backend/repositories/WebAuthnStepUpTokenRepository";
import { auditLogService } from "@/backend/services/AuditLogService";
import { getSessionEmployee } from "@/lib/auth/session";

/**
 * Password fallback for the biometric step-up gate.
 *
 * Identity is resolved SERVER-SIDE: the verified session employee's own
 * email is used for re-authentication. The action never accepts an email
 * parameter, so one employee can never verify as another.
 */

export interface VerifyStepUpPasswordResult {
  success: boolean;
  /** Single-use token to pass to recordEntry/recordExit on success. */
  stepUpToken?: string;
  error?: string;
}

/**
 * Account-level lockout (in-memory, same tradeoff as the shared rate
 * limiter): 5 consecutive failures lock verification for 15 minutes.
 * A success resets the counter.
 */
const MAX_CONSECUTIVE_FAILURES = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const failureTracker = new Map<
  string,
  { count: number; lockedUntil: number }
>();

function createAnonSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured");
  }
  // Deliberately NOT cookie-bound (no @supabase/ssr adapter): a successful
  // signInWithPassword here must NEVER touch the session cookies.
  return createClient(url, anonKey);
}

async function audit(action: string, employeeId: string): Promise<void> {
  try {
    await auditLogService.log({
      entity: "employee",
      entityId: employeeId,
      action,
    });
  } catch {
    // Audit failures must not break the fallback flow.
  }
}

export async function verifyStepUpPassword(
  password: string,
  intent: StepUpIntent
): Promise<VerifyStepUpPasswordResult> {
  try {
    await waitForDb();

    if (
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 128
    ) {
      return { success: false, error: "Invalid credentials" };
    }
    if (!STEP_UP_INTENTS.includes(intent)) {
      return { success: false, error: "Invalid verification intent" };
    }

    const employee = await getSessionEmployee();
    if (!employee) {
      return { success: false, error: "You must be signed in" };
    }
    if (!employee.email) {
      // No linked email means no password can exist — fail closed, generically.
      await audit("pwd_fallback_failed", employee.id);
      return { success: false, error: "Invalid credentials" };
    }

    const now = Date.now();
    const entry = failureTracker.get(employee.id);
    if (entry && entry.lockedUntil > now) {
      // Generic message: do not leak remaining cooldown length.
      return {
        success: false,
        error: "Too many attempts. Please wait and try again.",
      };
    }

    const supabase = createAnonSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: employee.email,
      password,
    });

    if (error) {
      const count = (entry?.count ?? 0) + 1;
      failureTracker.set(employee.id, {
        count,
        lockedUntil:
          count >= MAX_CONSECUTIVE_FAILURES ? now + LOCKOUT_WINDOW_MS : 0,
      });
      await audit("pwd_fallback_failed", employee.id);
      // Generic message per spec: wrong password vs locked are indistinguishable.
      return { success: false, error: "Invalid credentials" };
    }

    failureTracker.delete(employee.id);

    const stepUpToken = await webAuthnStepUpTokenRepository.issue(
      employee.id,
      intent
    );
    await audit("pwd_fallback_success", employee.id);

    return { success: true, stepUpToken };
  } catch {
    return { success: false, error: "Verification failed. Try again." };
  }
}
