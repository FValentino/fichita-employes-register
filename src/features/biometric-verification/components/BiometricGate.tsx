"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useWebAuthn } from "../hooks/useWebAuthn";
import type { StepUpIntent } from "../types";
import { PasswordFallbackForm } from "./PasswordFallbackForm";

interface BiometricGateProps {
  /** Which action the user is trying to record: binds the issued token. */
  intent: StepUpIntent;
  /**
   * Called once verification succeeds. `stepUpToken` is undefined only for
   * admin-exempt sessions (the server skipped the ceremony).
   */
  onVerified: (stepUpToken?: string) => void;
  /** The gated control (e.g. the attendance button). */
  children: ReactNode;
}

type GatePhase =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "fallback"; hint: string | null };

/**
 * Container that stands between the user and an attendance button:
 * it runs the WebAuthn step-up ceremony first and only then lets the
 * outcome through to `onVerified`. Falls back to password verification
 * when biometrics are unavailable or the ceremony fails with a
 * non-retryable code. Admins are exempt server-side and pass straight
 * through.
 *
 * The child control's own click is intercepted during the capture phase,
 * so the gated action can never fire before verification succeeds.
 */
export function BiometricGate({
  intent,
  onVerified,
  children,
}: BiometricGateProps) {
  const { platformAuthenticatorAvailable, authenticate } = useWebAuthn();
  const [phase, setPhase] = useState<GatePhase>({ kind: "idle" });
  const fallbackHeadingRef = useRef<HTMLParagraphElement>(null);

  // The availability probe decides the initial mode: no platform
  // authenticator means the password form renders without ever attempting
  // a WebAuthn ceremony. Derived at render time instead of synced via effect.
  const biometricsUnavailable = platformAuthenticatorAvailable === false;
  const effectivePhase: GatePhase = useMemo(
    () =>
      phase.kind === "idle" && biometricsUnavailable
        ? { kind: "fallback", hint: null }
        : phase,
    [phase, biometricsUnavailable]
  );

  // Move focus to the fallback message so keyboard/screen-reader users
  // notice the mode switch (spec: focus management on error).
  useEffect(() => {
    if (effectivePhase.kind === "fallback") {
      fallbackHeadingRef.current?.focus();
    }
  }, [effectivePhase]);

  const handleVerify = async () => {
    setPhase({ kind: "verifying" });

    const result = await authenticate(intent);

    switch (result.status) {
      case "verified":
      case "exempt": {
        setPhase({ kind: "idle" });
        onVerified(
          result.status === "verified" ? result.stepUpToken : undefined
        );
        return;
      }
      case "cancelled":
        // User dismissed the prompt — offer a plain retry, no penalty.
        setPhase({ kind: "idle" });
        return;
      case "unavailable":
        setPhase({ kind: "fallback", hint: null });
        return;
      case "failed":
        setPhase({ kind: "fallback", hint: fallbackHintFor(result.code) });
        return;
    }
  };

  /**
   * Capture-phase interceptor: swallows the first click on the wrapped
   * control and runs verification instead of letting the child's own
   * onClick fire unauthenticated. While verifying or in password mode the
   * click is blocked outright.
   */
  const interceptClick = (event: MouseEvent<HTMLDivElement>) => {
    if (effectivePhase.kind !== "idle") {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    void handleVerify();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        onClickCapture={interceptClick}
        aria-busy={effectivePhase.kind === "verifying"}
        aria-disabled={effectivePhase.kind !== "idle"}
      >
        <div
          className={
            effectivePhase.kind === "verifying"
              ? "pointer-events-none opacity-50"
              : undefined
          }
        >
          {children}
        </div>
      </div>

      {effectivePhase.kind === "verifying" && (
        <p role="status" className="text-sm text-gray-500 text-center m-0">
          Follow your device&apos;s biometric prompt...
        </p>
      )}

      {effectivePhase.kind === "fallback" && (
        <section aria-label="Password verification" className="w-full">
          <p
            ref={fallbackHeadingRef}
            tabIndex={-1}
            className="text-sm text-gray-600 text-center mt-0 mb-3 focus:outline-none"
          >
            {effectivePhase.hint ??
              "Biometric verification is not available on this device."}
          </p>
          <PasswordFallbackForm
            intent={intent}
            onSuccess={(token) => {
              setPhase({ kind: "idle" });
              onVerified(token);
            }}
            // With no authenticator there is nothing to retry — hide Cancel.
            onCancel={
              biometricsUnavailable ? undefined : () => setPhase({ kind: "idle" })
            }
          />
        </section>
      )}
    </div>
  );
}

/** Maps server error codes to short, actionable fallback hints. */
function fallbackHintFor(code: string): string | null {
  switch (code) {
    case "not_enrolled":
      return "This device is not enrolled for biometric verification yet.";
    case "credential_revoked":
      return "Biometric verification was revoked for your account.";
    default:
      return null;
  }
}
