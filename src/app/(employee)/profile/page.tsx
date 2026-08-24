"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { getEmployeeByAuthUserId } from "@/actions";
import { HiArrowLeft, HiArrowRightOnRectangle, HiUser } from "react-icons/hi2";

interface EmployeeData {
  name: string;
  lastName: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const result = await getEmployeeByAuthUserId(data.user.id);
        if (result.success && result.data) {
          setEmployee({
            name: result.data.name,
            lastName: result.data.lastName,
            email: result.data.email ?? data.user.email ?? "",
            role: result.data.role ?? "employee",
          });
        } else {
          // Fallback to Supabase user data
          setEmployee({
            name: "Empleado",
            lastName: "",
            email: data.user.email ?? "",
            role: "employee",
          });
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    // Clear role cookie
    document.cookie = "fichita-role=; path=/; max-age=0";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800 m-0">Mi Perfil</h1>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center">
              <HiUser className="w-8 h-8 text-neutral-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 m-0">
                {employee?.name} {employee?.lastName}
              </h2>
              <p className="text-gray-500 m-0">{employee?.email}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 m-0">
            Información
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Email</span>
              <span className="text-gray-800 font-medium">{employee?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Rol</span>
              <span className="text-gray-800 font-medium">{employee?.role === "admin" ? "Administrador" : "Empleado"}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border border-red-300 bg-white text-red-600 font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <HiArrowRightOnRectangle className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
