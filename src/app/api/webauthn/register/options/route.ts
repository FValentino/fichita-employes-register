import { NextResponse } from "next/server";
import { waitForDb } from "@/backend/datasource";
import { UserRole } from "@/backend/models/Employee";
import { webAuthService } from "@/backend/services/WebAuthService";
import { getSessionEmployee } from "@/lib/auth/session";
import { setStateCookie, signState } from "@/lib/auth/state-cookie";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";
import { jsonError, webAuthnErrorResponse } from "@/lib/webauthn/http";

/**
 * POST /api/webauthn/register/options
 *
 * First leg of enrollment: issues credential-creation options for the
 * session's employee and seals the challenge inside an HMAC-signed state
 * cookie. Admins never enroll (they are step-up exempt).
 */
export async function POST(request: Request) {
  const rateLimit = withRateLimit(
    request,
    RATE_LIMITS.webauthn,
    "webauthn:register:options"
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
      return jsonError(
        "Admins cannot enroll biometric credentials",
        403,
        "forbidden"
      );
    }
    if (!employee.authUserId) {
      return jsonError(
        "Account is not linked to an employee record",
        404,
        "account_not_linked"
      );
    }

    const options = await webAuthService.startRegistration(employee);

    const state = signState({
      challenge: options.challenge,
      employeeId: employee.id,
      kind: "registration",
    });
    await setStateCookie(state.token, state.maxAgeSeconds);

    return NextResponse.json(options);
  } catch (error) {
    const mapped = webAuthnErrorResponse(error);
    if (mapped) return mapped;
    return jsonError("Internal server error", 500);
  }
}
