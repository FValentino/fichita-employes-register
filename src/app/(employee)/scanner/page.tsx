"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { recordEntry, recordExit, getEmployeeTodayAttendances } from "@/actions";
import { HiCamera, HiCheckCircle, HiArrowLeft } from "react-icons/hi2";

export default function ScannerPage() {
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [lastType, setLastType] = useState<"ENTRADA" | "SALIDA" | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // For now, use the user ID as employee ID
        // In a real app, you'd look up the employee by authUserId
        setEmployeeId(data.user.id);
        checkStatus(data.user.id);
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  const checkStatus = async (id: string) => {
    const result = await getEmployeeTodayAttendances(id);
    if (result.success && result.data) {
      const lastRecord = result.data[result.data.length - 1];
      if (lastRecord?.type === "ENTRADA") {
        setLastType("ENTRADA");
      } else {
        setLastType("SALIDA");
      }
    }
    setStatus("ready");
  };

  const handleScan = async (type: "ENTRADA" | "SALIDA") => {
    if (!employeeId) return;
    setStatus("processing");
    setMessage("");

    const action = type === "ENTRADA" ? recordEntry : recordExit;
    const result = await action(employeeId);

    if (result.success) {
      setStatus("success");
      setMessage(type === "ENTRADA" ? "¡Entrada registrada!" : "¡Salida registrada!");
      setLastType(type);
      setTimeout(() => {
        setStatus("ready");
        setMessage("");
      }, 2000);
    } else {
      setStatus("error");
      setMessage(result.error || "Error al registrar");
      setTimeout(() => {
        setStatus("ready");
        setMessage("");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Registrar Asistencia
        </h1>

        {status === "loading" && (
          <div className="text-center text-gray-500">Cargando...</div>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleScan("ENTRADA")}
              disabled={lastType === "ENTRADA"}
              className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <HiCheckCircle className="w-6 h-6" />
              Registrar Entrada
            </button>

            <button
              onClick={() => handleScan("SALIDA")}
              disabled={lastType === "SALIDA"}
              className="w-full py-4 rounded-xl bg-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <HiCamera className="w-6 h-6" />
              Registrar Salida
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="text-center text-gray-500">Procesando...</div>
        )}

        {status === "success" && (
          <div className="p-6 bg-green-100 rounded-xl text-center">
            <HiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="text-green-700 font-bold text-lg m-0">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="p-6 bg-red-100 rounded-xl text-center">
            <p className="text-red-700 font-bold text-lg m-0">{message}</p>
          </div>
        )}

        <button
          onClick={() => router.push("/home")}
          className="mt-6 w-full py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
