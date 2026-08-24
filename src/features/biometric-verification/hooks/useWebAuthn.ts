"use client";

import { useCallback, useEffect, useState } from "react";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
} from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/server";
import type { AuthenticateResult, StepUpIntent } from "../types";

/**
 * Availability probe cache. Talking to the authenticator is expensive and
 * the answer cannot change mid-session in practice, so one probe per page
 * load is enough (design: "lazy cached platformAuthenticatorAvailable").
 */
let availabilityCache: boolean | null = null;

/**
 * Drives the WebAuthn assertion ceremony for attendance step-up:
 *
 *   POST /api/webauthn/assert/options  →  PublicKeyCredentialRequestOptionsJSON
 *   startAuthentication({ optionsJSON })  →  AuthenticationResponseJSON
 *   POST /api/webauthn/assert/verify    →  { verified: true, stepUpToken }
 *
 * The server decides everything that matters: it returns `{ exempt: true }`
 * for admins (no ceremony needed) and typed error codes otherwise. This hook
 * only orchestrates the browser side of the protocol.
 */
export function useWebAuthn() {
  const [platformAuthenticatorAvailable, setPlatformAuthenticatorAvailable] =
    useState<boolean | null>(availabilityCache);

  // Lazy availability probe: runs once, result cached module-wide.
  useEffect(() => {
    if (availabilityCache !== null) return;

    let cancelled = false;
    void (async () => {
      const available =
        browserSupportsWebAuthn() &&
        (await platformAuthenticatorIsAvailable().catch(() => false));
      availabilityCache = available;
      if (!cancelled) setPlatformAuthenticatorAvailable(available);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(
    async (intent: StepUpIntent): Promise<AuthenticateResult> => {
      if (!browserSupportsWebAuthn()) {
        return { status: "unavailable" };
      }

      // 1. Ask the server for assertion options.
      let options: PublicKeyCredentialRequestOptionsJSON;
      try {
        const optionsResponse = await fetch("/api/webauthn/assert/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent }),
        });

        if (!optionsResponse.ok) {
          const error = await optionsResponse.json().catch(() => ({}));
          // Without server config there is no biometric path at all —
          // the gate falls back to password verification.
          if (error.code === "config_missing") {
            return { status: "unavailable" };
          }
          return { status: "failed", code: error.code ?? "options_failed" };
        }

        const data = await optionsResponse.json();
        // Admin exemption: skip the ceremony entirely.
        if (data?.exempt === true) {
          return { status: "exempt" };
        }
        options = data as PublicKeyCredentialRequestOptionsJSON;
      } catch {
        return { status: "failed", code: "network_error" };
      }

      // 2. Run the browser ceremony against the platform authenticator.
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "AbortError")
        ) {
          // User dismissed the prompt or it timed out — not a failure.
          return { status: "cancelled" };
        }
        return { status: "failed", code: "ceremony_failed" };
      }

      // 3. Verify server-side and collect the step-up token.
      try {
        const verifyResponse = await fetch("/api/webauthn/assert/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: assertion, intent }),
        });

        if (!verifyResponse.ok) {
          const error = await verifyResponse.json().catch(() => ({}));
          return { status: "failed", code: error.code ?? "verify_failed" };
        }

        const result = await verifyResponse.json();
        return typeof result.stepUpToken === "string"
          ? { status: "verified", stepUpToken: result.stepUpToken }
          : { status: "failed", code: "token_missing" };
      } catch {
        return { status: "failed", code: "network_error" };
      }
    },
    []
  );

  return { platformAuthenticatorAvailable, authenticate };
}
