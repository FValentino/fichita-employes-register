"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { theme } from "@/lib/theme";
import { getEmployeeAttendances, getEmployee, updateAttendanceTimestamp } from "@/actions";
import { PageTitle } from "@/components/PageTitle";
import { HiArrowLeft, HiPencil } from "react-icons/hi2";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  type: "ENTRADA" | "SALIDA";
  timestamp: Date;
  createdAt: Date;
}

export default function AttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [employeeName, setEmployeeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    setLoading(true);
    const [attResult, empResult] = await Promise.all([
      getEmployeeAttendances(employeeId),
      getEmployee(employeeId),
    ]);

    if (attResult.success && attResult.data) {
      // Filter to current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const weekAttendances = attResult.data.filter((a) => {
        const ts = new Date(a.timestamp);
        return ts >= monday && ts <= sunday;
      });

      // Sort by timestamp descending
      weekAttendances.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendances(weekAttendances);
    }

    if (empResult.success && empResult.data) {
      setEmployeeName(`${empResult.data.name} ${empResult.data.lastName}`);
    }

    setLoading(false);
  };

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  };

  const formatDateTime = (dateStr: string | Date) => {
    return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
  };

  const toLocalDatetimeString = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    // Format as Argentina time for the input fields
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      time: `${get("hour")}:${get("minute")}`,
    };
  };

  const handleEdit = (att: AttendanceRecord) => {
    const { date, time } = toLocalDatetimeString(att.timestamp);
    setEditingId(att.id);
    setEditDate(date);
    setEditTime(time);
  };

  const handleSave = async () => {
    if (!editingId || !editDate || !editTime) return;

    setSaving(true);
    // Parse the date/time inputs as Argentina local time
    const [year, month, day] = editDate.split("-").map(Number);
    const [hours, minutes] = editTime.split(":").map(Number);
    
    // Create a date string and parse it as Argentina time
    // We use a trick: create the date, then adjust for timezone difference
    const localDate = new Date(year, month - 1, day, hours, minutes);
    
    // Get the timezone offset for Argentina (should be -180 minutes = -3 hours)
    const arOffset = -180; // Argentina is always UTC-3 (no DST)
    const localOffset = localDate.getTimezoneOffset(); // Server's offset in minutes
    
    // Convert to UTC: local time + (local offset - ar offset)
    const utcDate = new Date(localDate.getTime() + (localOffset + arOffset) * 60 * 1000);

    const result = await updateAttendanceTimestamp(editingId, utcDate);

    if (result.success) {
      setEditingId(null);
      await fetchData();
    } else {
      alert(result.error || "Error al guardar");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditDate("");
    setEditTime("");
  };

  const calculateTotalHours = () => {
    let totalMinutes = 0;
    // Group by pairs (entry + exit)
    const entries = attendances.filter((a) => a.type === "ENTRADA").reverse();
    const exits = attendances.filter((a) => a.type === "SALIDA").reverse();

    for (const entry of entries) {
      const exit = exits.find((e) => new Date(e.timestamp) > new Date(entry.timestamp));
      if (exit) {
        totalMinutes += (new Date(exit.timestamp).getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60);
      }
    }
    return (totalMinutes / 60).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/attendance")}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <PageTitle>Asistencia — {employeeName}</PageTitle>
          <p className="text-sm text-gray-500 m-0 mt-1">
            Semana actual • {calculateTotalHours()} horas totales
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left text-sm font-medium text-gray-500">Fecha</th>
              <th className="p-4 text-left text-sm font-medium text-gray-500">Tipo</th>
              <th className="p-4 text-left text-sm font-medium text-gray-500">Hora</th>
              <th className="p-4 text-center text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {attendances.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-500">
                  No hay registros esta semana
                </td>
              </tr>
            ) : (
              attendances.map((att, index) => (
                <tr
                  key={att.id}
                  className={index > 0 ? "border-t border-gray-100" : ""}
                >
                  <td className="p-4 text-sm text-gray-800">
                    {formatDate(att.timestamp)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        att.type === "ENTRADA"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {att.type}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-800">
                    {editingId === att.id ? (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    ) : (
                      formatTime(att.timestamp)
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {editingId === att.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-md bg-amber-500 text-neutral-900 text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          {saving ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(att)}
                        className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                        title="Editar hora"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
