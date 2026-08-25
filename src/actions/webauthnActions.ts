"use server";

import { createClient } from "@supabase/supabase-js";
import { waitForDb } from "@/backend/datasource";
import {
  STEP_UP_INTENTS,
  type StepUpIntent,
} from "@/backend/models/WebAuthnStepUpToken";
import { webAuthnStepUpTokenRepository } from "@/backend/repositories/WebAuthnStepUpTokenRepository";
import { auditLogService } from "@/backend/services/AuditLogService";
import { settingService } from "@/backend/services/SettingService";
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
 * Account-level lockout — persisted in the Setting table so it survives
 * cold starts and works across serverless instances.
 * 5 consecutive failures lock verification for 15 minutes.
 */
const MAX_CONSECUTIVE_FAILURES = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

function lockoutKey(employeeId: string): string {
  return `lockout:${employeeId}`;
}

async function getLockout(employeeId: string): Promise<{ count: number; lockedUntil: number } | null> {
  const value = await settingService.get(lockoutKey(employeeId));
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function setLockout(employeeId: string, count: number, lockedUntil: number): Promise<void> {
  await settingService.set(lockoutKey(employeeId), JSON.stringify({ count, lockedUntil }));
}

async function clearLockout(employeeId: string): Promise<void> {
  // Setting model has no delete, but setting to empty is fine — getLockout returns null on parse failure
  await settingService.set(lockoutKey(employeeId), "");
}

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
    const entry = await getLockout(employee.id);
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
      await setLockout(
        employee.id,
        count,
        count >= MAX_CONSECUTIVE_FAILURES ? now + LOCKOUT_WINDOW_MS : 0
      );
      await audit("pwd_fallback_failed", employee.id);
      // Generic message per spec: wrong password vs locked are indistinguishable.
      return { success: false, error: "Invalid credentials" };
    }

    await clearLockout(employee.id);

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
