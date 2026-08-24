import { NextResponse } from "next/server";
import {
  WebAuthnConfigMissingError,
  WebAuthnCounterRegressionError,
  WebAuthnCredentialRevokedError,
  WebAuthnCredentialTakenError,
  WebAuthnNotEnrolledError,
  WebAuthnVerificationFailedError,
} from "@/backend/services/WebAuthService";

/**
 * Uniform JSON error contract for the WebAuthn route handlers:
 * every failure responds `{ error: string, code?: string }`.
 */

export function jsonError(
  message: string,
  status: number,
  code?: string
): NextResponse {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

/**
 * Maps a thrown WebAuthService typed error to its HTTP response.
 * Returns `null` for unknown errors so callers decide their own fallback
 * (usually a generic 500 without leaking internals).
 */
export function webAuthnErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof WebAuthnConfigMissingError) {
    return jsonError("WebAuthn is not configured", 503, "config_missing");
  }
  if (error instanceof WebAuthnNotEnrolledError) {
    return jsonError("No credential enrolled", 404, "not_enrolled");
  }
  if (error instanceof WebAuthnCredentialRevokedError) {
    return jsonError(
      "Credential revoked, re-enrollment required",
      410,
      "credential_revoked"
    );
  }
  if (error instanceof WebAuthnCredentialTakenError) {
    return jsonError(
      "Credential already registered to another account",
      409,
      "credential_taken"
    );
  }
  if (error instanceof WebAuthnCounterRegressionError) {
    return jsonError(
      "Authenticator rejected, possible clone detected",
      400,
      "counter_regression"
    );
  }
  if (error instanceof WebAuthnVerificationFailedError) {
    return jsonError("Ceremony could not be verified", 400, "ceremony_invalid");
  }
  return null;
}
