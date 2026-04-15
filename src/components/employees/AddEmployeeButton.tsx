"use client";

import { theme } from "@/lib/theme";

export function AddEmployeeButton() {
  return (
    <button
      style={{
        backgroundColor: theme.colors.primary,
        color: theme.colors.neutral,
        padding: "12px 24px",
        borderRadius: "8px",
        border: "none",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      + Agregar Empleado
    </button>
  );
}
