"use client";

import { useRouter } from "next/navigation";
import { recordEntry, recordExit } from "@/actions";

interface RegisterAttendanceButtonProps {
  employeeId: string;
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
      className={`px-4 py-2 rounded-lg border-none font-semibold text-xs md:text-sm cursor-pointer transition-colors ${
        isWorking
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-amber-500 text-neutral-900 hover:bg-amber-600"
      }`}
    >
      {isWorking ? "Registrar salida" : "Registrar ingreso"}
    </button>
  );
}