import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { waitForDb } from "@/backend/datasource";
import { webAuthService } from "@/backend/services/WebAuthService";
import { getSessionEmployee } from "@/lib/auth/session";
import {
  clearStateCookie,
  readStateCookie,
} from "@/lib/auth/state-cookie";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";
import { jsonError, webAuthnErrorResponse } from "@/lib/webauthn/http";

/**
 * POST /api/webauthn/register/verify
 *
 * Second leg of enrollment: verifies the attestation against the challenge
 * sealed in the state cookie and persists the credential. The client posts
 * the browser's RegistrationResponseJSON as the JSON body.
 */
export async function POST(request: Request) {
  const rateLimit = withRateLimit(
    request,
    RATE_LIMITS.webauthn,
    "webauthn:register:verify"
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

    const state = await readStateCookie("registration");
    if (!state) {
      return jsonError(
        "Missing or invalid ceremony state",
        400,
        "state_invalid"
      );
    }
    if (state.employeeId !== employee.id) {
      // Signed cookie belongs to a different session — reject without
      // consuming anything.
      return jsonError("Ceremony state does not match session", 400, "state_invalid");
    }

    let response: RegistrationResponseJSON;
    try {
      response = (await request.json()) as RegistrationResponseJSON;
    } catch {
      return jsonError("Malformed request body", 400, "malformed_request");
    }
    if (
      typeof response !== "object" ||
      response === null ||
      typeof response.id !== "string" ||
      typeof response.response?.clientDataJSON !== "string"
    ) {
      return jsonError(
        "Body is not a registration response",
        400,
        "malformed_request"
      );
    }

    try {
      await webAuthService.finishRegistration(
        employee.id,
        response,
        state.challenge
      );

      await clearStateCookie();
      return NextResponse.json({ verified: true });
    } catch (error) {
      // A spent ceremony must never leave reusable state behind.
      await clearStateCookie();
      const mapped = webAuthnErrorResponse(error);
      if (mapped) return mapped;
      return jsonError("Internal server error", 500);
    }
  } catch {
    return jsonError("Internal server error", 500);
  }
}
