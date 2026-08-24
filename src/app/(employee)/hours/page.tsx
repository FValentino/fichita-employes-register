"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { getEmployeeWeeklyTurns, getEmployeeMonthlyTurns, getPayweekTurns, getEmployeeByAuthUserId } from "@/actions";
import { HiArrowLeft } from "react-icons/hi2";

type TimeRange = "week" | "month" | "payweek";

interface Turn {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

export default function HoursPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>("week");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [workDays, setWorkDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const result = await getEmployeeByAuthUserId(data.user.id);
        if (result.success && result.data) {
          setEmployeeId(result.data.id);
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    if (!employeeId) return;
    loadTurns();
  }, [employeeId, range]);

  const loadTurns = async () => {
    if (!employeeId) return;
    setLoading(true);

    let result;
    switch (range) {
      case "week":
        result = await getEmployeeWeeklyTurns(employeeId);
        break;
      case "month":
        result = await getEmployeeMonthlyTurns(employeeId);
        break;
      case "payweek":
        result = await getPayweekTurns(employeeId);
        break;
    }

    if (result?.success && result.data) {
      setTurns(result.data.turns);

      // Calculate total hours
      let totalMinutes = 0;
      const uniqueDays = new Set<string>();
      for (const turn of result.data.turns) {
        if (turn.entryTime && turn.exitTime) {
          const entry = new Date(turn.entryTime).getTime();
          const exit = new Date(turn.exitTime).getTime();
          totalMinutes += (exit - entry) / (1000 * 60);
          const date = new Date(turn.entryTime);
          uniqueDays.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        }
      }
      setTotalHours(totalMinutes / 60);
      setWorkDays(uniqueDays.size);
    }

    setLoading(false);
  };

  const formatTime = (dateStr: Date | null) => {
    if (!dateStr) return "--:--";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: Date | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/home")}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 m-0">Horas Trabajadas</h1>
        </div>

        {/* Range selector */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {([
            { value: "week", label: "Semana" },
            { value: "month", label: "Mes" },
            { value: "payweek", label: "Quincena" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                range === opt.value
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-amber-500 m-0">{totalHours.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-1 m-0">Horas totales</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-3xl font-bold text-amber-500 m-0">{workDays}</p>
            <p className="text-sm text-gray-500 mt-1 m-0">Días trabajados</p>
          </div>
        </div>

        {/* Turns list */}
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : turns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 m-0">No hay registros en este período</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500 m-0">{formatDate(turn.entryTime)}</p>
                  <p className="font-semibold text-gray-800 m-0 mt-1">
                    {formatTime(turn.entryTime)} — {formatTime(turn.exitTime)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    turn.isOpen
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {turn.isOpen ? "Abierto" : "Cerrado"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
