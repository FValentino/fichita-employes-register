"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase";
import {
  HiClock,
  HiDocumentText,
  HiArrowRightOnRectangle,
  HiArrowLeftOnRectangle,
} from "react-icons/hi2";

interface EmployeeData {
  name: string;
  lastName: string;
  email: string;
  isWorking: boolean;
}

export default function HomePage() {
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmployee({
          name: "Empleado",
          lastName: "",
          email: data.user.email ?? "",
          isWorking: false,
        });
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 m-0">
            {getGreeting()}, {employee?.name}
          </h1>
          <p className="text-gray-500 mt-1 m-0">{employee?.email}</p>
        </div>

        {/* Status card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                employee?.isWorking ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {employee?.isWorking ? (
                <HiArrowRightOnRectangle className="w-6 h-6 text-green-600" />
              ) : (
                <HiArrowLeftOnRectangle className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 m-0">
                {employee?.isWorking ? "Trabajando" : "Sin registro hoy"}
              </h2>
              <p className="text-sm text-gray-500 m-0">
                {employee?.isWorking
                  ? "Tu jornada está en curso"
                  : "Registra tu entrada para comenzar"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link
            href="/scanner"
            className="bg-amber-500 text-neutral-900 p-6 rounded-xl font-semibold text-center hover:bg-amber-600 transition-colors text-decoration-none"
          >
            <HiClock className="w-8 h-8 mx-auto mb-2" />
            Registrar Asistencia
          </Link>

          <Link
            href="/hours"
            className="bg-white text-gray-800 p-6 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors text-decoration-none shadow-sm border border-gray-100"
          >
            <HiClock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            Ver Horas
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/justifications"
            className="bg-white text-gray-800 p-6 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors text-decoration-none shadow-sm border border-gray-100"
          >
            <HiDocumentText className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            Justificaciones
          </Link>

          <Link
            href="/profile"
            className="bg-white text-gray-800 p-6 rounded-xl font-semibold text-center hover:bg-gray-50 transition-colors text-decoration-none shadow-sm border border-gray-100"
          >
            <div className="w-8 h-8 mx-auto mb-2 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {employee?.name?.[0]}
            </div>
            Mi Perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
