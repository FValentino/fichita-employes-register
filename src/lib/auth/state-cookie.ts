import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getWebAuthnConfig } from "@/lib/webauthn/config";

/**
 * HMAC-SHA256 signed state cookie for WebAuthn ceremonies.
 *
 * Between "options" and "verify" calls the server must remember the exact
 * challenge it issued and for whom. Client-supplied state is untrusted, so
 * the payload is signed with WEBAUTHN_STATE_SECRET and verified with a
 * constant-time comparison before use.
 *
 * Token format (compact, cookie-safe):
 *   base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload))
 *
 * Mutation helpers (.set) are only legal inside Route Handlers and Server
 * Functions — callers are the webauthn options/verify route handlers.
 */

export type WebAuthnStateKind = "registration" | "assertion";

export const WEBAUTHN_STATE_COOKIE = "webauthn_state";

/** Ceremony states live 5 minutes by default; long enough for biometric prompts. */
export const STATE_TTL_SECONDS = 300;

export interface WebAuthnStatePayload {
  /** The challenge issued to the authenticator; must round-trip unchanged. */
  challenge: string;
  employeeId: string;
  kind: WebAuthnStateKind;
  /** Issued-at, seconds since epoch. */
  iat: number;
  /** Expiry, seconds since epoch. */
  exp: number;
}

export interface SignStateInput {
  challenge: string;
  employeeId: string;
  kind: WebAuthnStateKind;
  /** Lifetime in seconds. Defaults to STATE_TTL_SECONDS. */
  ttlSeconds?: number;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function getStateSecretHex(): string | null {
  return getWebAuthnConfig()?.stateSecret ?? null;
}

/** Signs `signingInput` with HMAC-SHA256 using the hex-configured secret. */
function hmacSha256(secretHex: string, signingInput: string): Buffer {
  return createHmac("sha256", Buffer.from(secretHex, "hex"))
    .update(signingInput)
    .digest();
}

function isValidPayload(value: unknown): value is WebAuthnStatePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.challenge === "string" &&
    candidate.challenge.length > 0 &&
    typeof candidate.employeeId === "string" &&
    candidate.employeeId.length > 0 &&
    (candidate.kind === "registration" || candidate.kind === "assertion") &&
    typeof candidate.iat === "number" &&
    Number.isFinite(candidate.iat) &&
    typeof candidate.exp === "number" &&
    Number.isFinite(candidate.exp)
  );
}

/**
 * Creates a signed state token for a WebAuthn ceremony.
 * Throws only when the WebAuthn configuration is missing — routes must
 * surface `config_missing` before reaching this point.
 */
export function signState(input: SignStateInput): {
  token: string;
  maxAgeSeconds: number;
} {
  const secretHex = getStateSecretHex();
  if (!secretHex) {
    throw new Error(
      "WebAuthn configuration missing: cannot sign ceremony state"
    );
  }

  const ttlSeconds = input.ttlSeconds ?? STATE_TTL_SECONDS;
  const iat = nowSeconds();
  const payload: WebAuthnStatePayload = {
    challenge: input.challenge,
    employeeId: input.employeeId,
    kind: input.kind,
    iat,
    exp: iat + ttlSeconds,
  };

  const signingInput = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = hmacSha256(secretHex, signingInput).toString("base64url");

  return { token: `${signingInput}.${signature}`, maxAgeSeconds: ttlSeconds };
}

/**
 * Verifies a signed state token: constant-time MAC check, structural
 * validation, expiry, and ceremony-kind binding. Returns `null` on any
 * failure — this function never throws.
 */
export function verifyState(
  token: string,
  expectedKind: WebAuthnStateKind
): WebAuthnStatePayload | null {
  const secretHex = getStateSecretHex();
  if (!secretHex) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  const [signingInput, signatureBase64Url] = parts;

  const expectedMac = hmacSha256(secretHex, signingInput);
  let receivedMac: Buffer;
  try {
    receivedMac = Buffer.from(signatureBase64Url, "base64url");
  } catch {
    return null;
  }
  if (receivedMac.length !== expectedMac.length) {
    return null;
  }
  if (!timingSafeEqual(receivedMac, expectedMac)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(signingInput, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isValidPayload(payload)) {
    return null;
  }
  if (payload.exp <= nowSeconds()) {
    return null;
  }
  if (payload.kind !== expectedKind) {
    return null;
  }
  return payload;
}

function baseCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Stores the signed state cookie. Route Handlers / Server Actions only. */
export async function setStateCookie(
  token: string,
  maxAgeSeconds: number
): Promise<void> {
  const store = await cookies();
  store.set(WEBAUTHN_STATE_COOKIE, token, baseCookieOptions(maxAgeSeconds));
}

/** Clears the state cookie immediately (empty value + maxAge 0). */
export async function clearStateCookie(): Promise<void> {
  const store = await cookies();
  store.set(WEBAUTHN_STATE_COOKIE, "", baseCookieOptions(0));
}

/**
 * Reads and verifies the state cookie against the expected ceremony kind.
 * Returns null when absent or invalid; verification failures never throw.
 */
export async function readStateCookie(
  expectedKind: WebAuthnStateKind
): Promise<WebAuthnStatePayload | null> {
  const store = await cookies();
  const raw = store.get(WEBAUTHN_STATE_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  return verifyState(raw, expectedKind);
}
