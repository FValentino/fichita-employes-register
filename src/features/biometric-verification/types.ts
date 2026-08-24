/**
 * Shared contracts for the biometric step-up verification feature.
 *
 * `StepUpIntent` is re-exported from the backend model so the API contract
 * has a single source of truth; the import is type-only and never reaches
 * the client bundle.
 */
export type { StepUpIntent } from "@/backend/models/WebAuthnStepUpToken";

/**
 * Result of a WebAuthn step-up ceremony driven by `useWebAuthn`.
 *
 * - `verified`: assertion succeeded; carry the single-use token to the
 *   attendance server action.
 * - `exempt`: the server resolved an admin session (`{ exempt: true }`) —
 *   no token is needed, attendance may proceed directly.
 * - `cancelled`: the user dismissed the biometric prompt (NotAllowedError /
 *   AbortError). No server penalty beyond rate limiting.
 * - `unavailable`: WebAuthn or the platform authenticator cannot be used —
 *   the gate must fall back to password verification.
 * - `failed`: the ceremony failed for a machine-readable reason (`code`
 *   mirrors the route error contract: `not_enrolled`, `credential_revoked`,
 *   `ceremony_invalid`, ...).
 */
export type AuthenticateResult =
  | { status: "verified"; stepUpToken: string }
  | { status: "exempt" }
  | { status: "cancelled" }
  | { status: "unavailable" }
  | { status: "failed"; code: string };
