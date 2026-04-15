"use client";

import { theme } from "@/lib/theme";

export function Header() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 24px",
        backgroundColor: theme.colors.neutral,
        color: theme.colors.white,
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: theme.colors.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "20px",
          color: theme.colors.neutral,
          marginRight: "12px",
        }}
      >
        FB
      </div>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          margin: 0,
        }}
      >
        FichitaBit
      </h1>
    </header>
  );
}
