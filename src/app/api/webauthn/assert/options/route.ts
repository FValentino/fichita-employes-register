import { NextResponse } from "next/server";
import { waitForDb } from "@/backend/datasource";
import { UserRole } from "@/backend/models/Employee";
import { webAuthService } from "@/backend/services/WebAuthService";
import { getSessionEmployee } from "@/lib/auth/session";
import { setStateCookie, signState } from "@/lib/auth/state-cookie";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";
import { jsonError, webAuthnErrorResponse } from "@/lib/webauthn/http";

/**
 * POST /api/webauthn/assert/options
 *
 * First leg of step-up verification. Admins are exempt server-side and get
 * `{ exempt: true }` — the client skips the biometric prompt for them.
 */
export async function POST(request: Request) {
  const rateLimit = withRateLimit(
    request,
    RATE_LIMITS.webauthn,
    "webauthn:assert:options"
  );
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    await waitForDb();

    const employee = await getSessionEmployee();
    if (!employee) {
      return jsonError("Authentication required", 401, "unauthenticated");
    }
    if (employee.role === UserRole.ADMIN) {
      return NextResponse.json({ exempt: true });
    }

    const options = await webAuthService.startAssertion(employee.id);

    const state = signState({
      challenge: options.challenge,
      employeeId: employee.id,
      kind: "assertion",
    });
    await setStateCookie(state.token, state.maxAgeSeconds);

    return NextResponse.json(options);
  } catch (error) {
    const mapped = webAuthnErrorResponse(error);
    if (mapped) return mapped;
    return jsonError("Internal server error", 500);
  }
}
