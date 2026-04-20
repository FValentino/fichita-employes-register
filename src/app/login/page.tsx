"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme } from "@/lib/theme";
import { createSupabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.gray[100],
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.white,
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: theme.colors.primary,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.neutral}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1
            style={{
              color: theme.colors.neutral,
              fontSize: "24px",
              fontWeight: "bold",
              margin: 0,
            }}
          >
            FichitaBit
          </h1>
          <p
            style={{
              color: theme.colors.gray[500],
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            Sistema de control de asistencia
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: theme.colors.neutral,
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.gray[300]}`,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.gray[300];
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: theme.colors.neutral,
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.gray[300]}`,
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.gray[300];
              }}
            />
          </div>

          {error && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: loading ? theme.colors.gray[400] : theme.colors.secondary,
              color: theme.colors.neutral,
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
