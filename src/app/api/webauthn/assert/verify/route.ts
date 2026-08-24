import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { waitForDb } from "@/backend/datasource";
import {
  STEP_UP_INTENTS,
  type StepUpIntent,
} from "@/backend/models/WebAuthnStepUpToken";
import { webAuthService } from "@/backend/services/WebAuthService";
import { getSessionEmployee } from "@/lib/auth/session";
import {
  clearStateCookie,
  readStateCookie,
} from "@/lib/auth/state-cookie";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";
import { jsonError, webAuthnErrorResponse } from "@/lib/webauthn/http";

/**
 * POST /api/webauthn/assert/verify
 *
 * Second leg of step-up verification: checks the assertion against the
 * challenge sealed in the state cookie and issues a single-use step-up
 * token bound to the session employee and the requested intent.
 * Body: `{ response: AuthenticationResponseJSON, intent: "entry" | "exit" }`.
 */
export async function POST(request: Request) {
  const rateLimit = withRateLimit(
    request,
    RATE_LIMITS.webauthn,
    "webauthn:assert:verify"
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

    const state = await readStateCookie("assertion");
    if (!state) {
      return jsonError(
        "Missing or invalid ceremony state",
        400,
        "state_invalid"
      );
    }
    if (state.employeeId !== employee.id) {
      return jsonError(
        "Ceremony state does not match session",
        400,
        "state_invalid"
      );
    }

    let body: { response?: AuthenticationResponseJSON; intent?: string };
    try {
      body = (await request.json()) as {
        response?: AuthenticationResponseJSON;
        intent?: string;
      };
    } catch {
      return jsonError("Malformed request body", 400, "malformed_request");
    }

    const intent = body.intent as StepUpIntent;
    if (!intent || !STEP_UP_INTENTS.includes(intent)) {
      return jsonError("Invalid step-up intent", 400, "invalid_intent");
    }
    const response = body.response;
    if (
      typeof response !== "object" ||
      response === null ||
      typeof response.id !== "string" ||
      typeof response.response?.clientDataJSON !== "string"
    ) {
      return jsonError(
        "Body is not an authentication response",
        400,
        "malformed_request"
      );
    }

    try {
      const stepUpToken = await webAuthService.finishAssertion(
        employee.id,
        response,
        state.challenge,
        intent
      );

      await clearStateCookie();
      return NextResponse.json({ verified: true, stepUpToken });
    } catch (error) {
      // A spent ceremony must never leave reusable state behind.
      await clearStateCookie();
      const mapped = webAuthnErrorResponse(error);
      if (mapped) return mapped;
      return jsonError("Internal server error", 500);
    }
  } catch (error) {
    const mapped = webAuthnErrorResponse(error);
    if (mapped) return mapped;
    return jsonError("Internal server error", 500);
  }
}
