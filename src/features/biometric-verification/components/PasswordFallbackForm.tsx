"use client";

import { useState, type FormEvent } from "react";
import { verifyStepUpPassword } from "@/actions/webauthnActions";
import type { StepUpIntent } from "../types";

interface PasswordFallbackFormProps {
  intent: StepUpIntent;
  /** Receives the single-use step-up token issued after verification. */
  onSuccess: (stepUpToken: string) => void;
  onCancel?: () => void;
}

/**
 * Password fallback for devices without biometrics (or when the WebAuthn
 * ceremony cannot proceed). Re-authenticates the session's own account via
 * a server action and yields the same step-up token as the biometric path.
 */
export function PasswordFallbackForm({
  intent,
  onSuccess,
  onCancel,
}: PasswordFallbackFormProps) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || password.length === 0) return;

    setSubmitting(true);
    setError(null);

    const result = await verifyStepUpPassword(password, intent);

    if (result.success && result.stepUpToken) {
      setPassword("");
      onSuccess(result.stepUpToken);
      return;
    }

    setError(result.error ?? "Verification failed. Try again.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <div>
        <label
          htmlFor="step-up-password"
          className="block text-sm font-medium text-gray-700 mb-1 text-left"
        >
          Confirm your password
        </label>
        <input
          id="step-up-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={submitting}
          required
          maxLength={128}
          autoComplete="current-password"
          autoFocus
          aria-describedby={error ? "step-up-password-error" : undefined}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {error && (
        <p
          id="step-up-password-error"
          role="alert"
          className="text-sm text-red-600 font-medium text-left m-0"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || password.length === 0}
        className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {submitting ? "Verifying..." : "Verify"}
      </button>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
