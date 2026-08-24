"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEmployeeTurns, saveEmployeeTurns } from "@/actions";

const DAYS = [
  { value: 0, label: "Lun" },
  { value: 1, label: "Mar" },
  { value: 2, label: "Mié" },
  { value: 3, label: "Jue" },
  { value: 4, label: "Vie" },
  { value: 5, label: "Sáb" },
  { value: 6, label: "Dom" },
];

interface TurnData {
  dayOfWeek: number;
  entryTime: string;
  exitTime: string;
  enabled: boolean;
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function AssignTurnsButton({ employee }: { employee: { id: string; name: string; lastName: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<TurnData[]>(
    DAYS.map((d) => ({ dayOfWeek: d.value, entryTime: "09:00", exitTime: "17:00", enabled: false }))
  );
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadTurns();
    }
  }, [isOpen]);

  const loadTurns = async () => {
    const result = await getEmployeeTurns(employee.id);
    if (result.success && result.data) {
      const existing = result.data;
      setTurns(
        DAYS.map((d) => {
          const found = existing.find((t: any) => t.dayOfWeek === d.value);
          return {
            dayOfWeek: d.value,
            entryTime: found?.entryTime ?? "09:00",
            exitTime: found?.exitTime ?? "17:00",
            enabled: found?.active ?? false,
          };
        })
      );
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setTurns((prev) =>
      prev.map((t) => (t.dayOfWeek === dayOfWeek ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: "entryTime" | "exitTime", value: string) => {
    setTurns((prev) =>
      prev.map((t) => (t.dayOfWeek === dayOfWeek ? { ...t, [field]: value } : t))
    );
  };

  const handleCopyToAll = () => {
    const firstEnabled = turns.find((t) => t.enabled);
    if (!firstEnabled) return;
    setTurns((prev) =>
      prev.map((t) =>
        t.enabled
          ? { ...t, entryTime: firstEnabled.entryTime, exitTime: firstEnabled.exitTime }
          : t
      )
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const activeTurns = turns
      .filter((t) => t.enabled)
      .map((t) => ({
        dayOfWeek: t.dayOfWeek,
        entryTime: t.entryTime || null,
        exitTime: t.exitTime || null,
      }));

    const result = await saveEmployeeTurns({
      employeeId: employee.id,
      turns: activeTurns,
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setError(result.error || "Error al guardar turnos");
    }
  };

  const enabledCount = turns.filter((t) => t.enabled).length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-md border border-blue-500 bg-white text-blue-600 text-xs font-medium cursor-pointer hover:bg-blue-50 transition-colors"
      >
        Turnos
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white p-6 md:p-8 rounded-xl w-full max-w-lg shadow-lg relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 bg-transparent border-none text-red-500 cursor-pointer p-1">
              <CloseIcon />
            </button>

            <h2 className="text-xl font-bold text-gray-800 mt-0 mb-1 text-center">
              Asignar Turnos
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {employee.lastName}, {employee.name}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 mb-4">
              {DAYS.map((day) => {
                const turn = turns.find((t) => t.dayOfWeek === day.value)!;
                return (
                  <div
                    key={day.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      turn.enabled ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer min-w-[60px]">
                      <input
                        type="checkbox"
                        checked={turn.enabled}
                        onChange={() => handleToggleDay(day.value)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className={`text-sm font-medium ${turn.enabled ? "text-gray-800" : "text-gray-400"}`}>
                        {day.label}
                      </span>
                    </label>

                    {turn.enabled ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={turn.entryTime}
                          onChange={(e) => handleTimeChange(turn.dayOfWeek, "entryTime", e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm text-center focus:border-amber-500 outline-none"
                        />
                        <span className="text-gray-400 text-sm">a</span>
                        <input
                          type="time"
                          value={turn.exitTime}
                          onChange={(e) => handleTimeChange(turn.dayOfWeek, "exitTime", e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded border border-gray-300 text-sm text-center focus:border-amber-500 outline-none"
                        />
                      </div>
                    ) : (
                      <span className="flex-1 text-center text-sm text-gray-400">Sin turno</span>
                    )}
                  </div>
                );
              })}
            </div>

            {enabledCount > 1 && (
              <button
                onClick={handleCopyToAll}
                className="w-full mb-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Copiar horario a todos los días activos
              </button>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-lg bg-amber-500 text-neutral-900 font-semibold text-sm cursor-pointer hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
