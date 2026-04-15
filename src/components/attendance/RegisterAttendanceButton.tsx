"use client";

import { useRouter } from "next/navigation";
import { recordEntry, recordExit } from "@/actions";
import { theme } from "@/lib/theme";

interface RegisterAttendanceButtonProps {
  employeeId: number;
  isWorking: boolean;
}

export function RegisterAttendanceButton({ employeeId, isWorking }: RegisterAttendanceButtonProps) {
  const router = useRouter();

  const handleRegister = async () => {
    if (isWorking) {
      const result = await recordExit(employeeId);
      if (!result.success) {
        alert(result.error || "Error al registrar salida");
        return;
      }
    } else {
      const result = await recordEntry(employeeId);
      if (!result.success) {
        alert(result.error || "Error al registrar entrada");
        return;
      }
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleRegister}
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        border: "none",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer",
        backgroundColor: isWorking ? "#EF4444" : "#22C55E",
        color: theme.colors.white,
      }}
    >
      {isWorking ? "Registrar salida" : "Registrar ingreso"}
    </button>
  );
}
