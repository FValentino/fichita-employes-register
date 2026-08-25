"use client";

import { useCallback, useState } from "react";
import {
  browserSupportsWebAuthn,
  startRegistration,
} from "@simplewebauthn/browser";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

interface PasskeyEnrollmentProps {
  onEnrolled: () => void;
  onSkip: () => void;
}

type EnrollmentPhase =
  | { kind: "idle" }
  | { kind: "enrolling" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Prompts the employee to register a passkey (biometric credential) on
 * their device. This is shown once after first login before they can
 * use biometric verification for attendance.
 */
export function PasskeyEnrollment({
  onEnrolled,
  onSkip,
}: PasskeyEnrollmentProps) {
  const [phase, setPhase] = useState<EnrollmentPhase>({ kind: "idle" });

  const handleEnroll = useCallback(async () => {
    if (!browserSupportsWebAuthn()) {
      setPhase({
        kind: "error",
        message: "Tu navegador no soporta passkeys. Usa la contraseña.",
      });
      return;
    }

    setPhase({ kind: "enrolling" });

    try {
      // 1. Get registration options from server
      const optionsRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!optionsRes.ok) {
        const error = await optionsRes.json().catch(() => ({}));
        if (error.code === "already_enrolled") {
          // Already has a passkey, just continue
          onEnrolled();
          return;
        }
        setPhase({
          kind: "error",
          message: error.error || "No se pudieron obtener las opciones",
        });
        return;
      }

      const options = await optionsRes.json();

      // 2. Run browser registration ceremony
      let registration: RegistrationResponseJSON;
      try {
        registration = await startRegistration({ optionsJSON: options });
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "AbortError")
        ) {
          setPhase({ kind: "idle" });
          return;
        }
        setPhase({
          kind: "error",
          message: "El registro fue cancelado o falló",
        });
        return;
      }

      // 3. Verify with server
      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registration),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json().catch(() => ({}));
        setPhase({
          kind: "error",
          message: error.error || "La verificación falló",
        });
        return;
      }

      setPhase({ kind: "success" });
      setTimeout(onEnrolled, 1500);
    } catch {
      setPhase({
        kind: "error",
        message: "Error de red. Intenta de nuevo.",
      });
    }
  }, [onEnrolled]);

  if (phase.kind === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-green-800 font-medium m-0">
          Passkey registrada exitosamente
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 m-0 mb-2">
          Registra tu passkey
        </h3>
        <p className="text-sm text-gray-600 m-0 mb-4">
          Para verificar tu identidad con biometricos al registrar asistencia,
          necesitas registrar una passkey en tu dispositivo.
        </p>
      </div>

      {phase.kind === "error" && (
        <p className="text-sm text-red-600 text-center mb-4">{phase.message}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleEnroll}
          disabled={phase.kind === "enrolling"}
          className="flex-1 bg-amber-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {phase.kind === "enrolling"
            ? "Registrando..."
            : "Registrar passkey"}
        </button>
        <button
          onClick={onSkip}
          className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Usar contraseña
        </button>
      </div>
    </div>
  );
}
