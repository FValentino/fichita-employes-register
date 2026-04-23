"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordEntry, recordExit } from "@/actions";

interface RegisterAttendanceButtonProps {
  employeeId: string;
  isWorking: boolean;
}

export function RegisterAttendanceButton({ employeeId, isWorking: initialIsWorking }: RegisterAttendanceButtonProps) {
  const [isWorking, setIsWorking] = useState(initialIsWorking);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    
    startTransition(async () => {
      let result;
      
      if (isWorking) {
        result = await recordExit(employeeId);
      } else {
        result = await recordEntry(employeeId);
      }

      if (!result.success) {
        setError(result.error || "Error al registrar");
        return;
      }

      // Solo cambiar estado si fue exitoso
      setIsWorking(!isWorking);
      router.refresh();
    });
  };

  const buttonText = isPending 
    ? "Procesando..." 
    : isWorking 
      ? "Registrar salida" 
      : "Registrar ingreso";

  return (
    <div className="inline-flex flex-col items-end">
      <button
        onClick={handleRegister}
        disabled={isPending}
        className={`px-4 py-2 rounded-lg border-none font-semibold text-xs md:text-sm cursor-pointer transition-colors ${
          isWorking
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-amber-500 text-neutral-900 hover:bg-amber-600"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {buttonText}
      </button>
      {error && (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      )}
    </div>
  );
}