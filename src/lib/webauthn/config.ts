import { z } from "zod";

/**
 * WebAuthn relying-party configuration.
 *
 * Validated lazily via `getWebAuthnConfig()` instead of at import time:
 * a missing/invalid configuration must NOT crash unrelated routes —
 * biometric endpoints respond 503 `config_missing` while the step-up
 * gate stays enforced through the password fallback.
 */

const webAuthnEnvSchema = z.object({
  /** Effective domain the credentials bind to permanently. */
  WEBAUTHN_RP_ID: z.string().min(1),
  WEBAUTHN_RP_NAME: z.string().min(1).default("Fichita"),
  /** Exact origin (scheme + host + optional port), no path/query/hash. */
  WEBAUTHN_ORIGIN: z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        url.pathname === "/" &&
        url.search === "" &&
        url.hash === ""
      );
    }),
  /**
   * HMAC secret for ceremony state cookies.
   * Must be hex with >= 32 bytes of entropy (`openssl rand -hex 32`).
   */
  WEBAUTHN_STATE_SECRET: z.hex().refine((value) => value.length >= 64),
});

export interface WebAuthnConfig {
  rpID: string;
  rpName: string;
  expectedOrigin: string;
  /** Hex-encoded secret used to sign ceremony state cookies. */
  stateSecret: string;
}

/**
 * Returns the validated WebAuthn configuration, or `null` when any
 * variable is missing/invalid. Callers treat `null` as `config_missing`.
 */
export function getWebAuthnConfig(): WebAuthnConfig | null {
  const parsed = webAuthnEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    return null;
  }
  return {
    rpID: parsed.data.WEBAUTHN_RP_ID,
    rpName: parsed.data.WEBAUTHN_RP_NAME,
    expectedOrigin: parsed.data.WEBAUTHN_ORIGIN,
    stateSecret: parsed.data.WEBAUTHN_STATE_SECRET,
  };
}
