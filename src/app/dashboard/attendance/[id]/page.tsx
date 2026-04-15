"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { theme } from "@/lib/theme";
import { getEmployeeWeeklyTurns, Turno } from "@/actions";

interface TurnoData {
  id: number;
  entryTime: string | null;
  exitTime: string | null;
  isOpen: boolean;
}

interface WeeklyData {
  turns: TurnoData[];
  monday: string;
  sunday: string;
}

export default function AttendanceDetailPage() {
  const params = useParams();
  const employeeId = Number(params.id);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [hourlyRate, setHourlyRate] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getEmployeeWeeklyTurns(employeeId);
      if (result.success && result.data) {
        setWeeklyData(result.data as WeeklyData);
      }
      setLoading(false);
    }
    fetchData();
  }, [employeeId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Turno en proceso";
    const date = new Date(dateStr);
    return `${formatDate(dateStr)} ${date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const calculateSalary = () => {
    if (!weeklyData) return "0.00";
    let totalHours = 0;
    weeklyData.turns.forEach((turno) => {
      if (turno.entryTime && turno.exitTime) {
        const entry = new Date(turno.entryTime);
        const exit = new Date(turno.exitTime);
        const hours = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
    return (totalHours * hourlyRate).toFixed(2);
  };

  if (loading) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!weeklyData) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <p>Error al cargar los datos</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: theme.colors.neutral, marginBottom: "24px", fontSize: "24px", fontWeight: "bold" }}>
        Asistencia desde {formatDate(weeklyData.monday)} hasta {formatDate(weeklyData.sunday)}
      </h2>

      <div
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "16px",
        }}
      >
        <p style={{ color: theme.colors.gray[500], fontSize: "14px", marginBottom: "8px" }}>
          <strong>Sueldo hasta hoy:</strong> ${calculateSalary()}
        </p>

        <div
          style={{
            backgroundColor: "#FEF3C7",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          <p style={{ color: "#92400E", fontSize: "12px", margin: 0 }}>
            Para el sueldo no se tiene en cuenta el turno en proceso
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: theme.colors.gray[100] }}>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  color: theme.colors.gray[500],
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Inicio del turno
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  color: theme.colors.gray[500],
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Fin del turno
              </th>
            </tr>
          </thead>
          <tbody>
            {weeklyData.turns.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: theme.colors.gray[500],
                  }}
                >
                  No hay registros esta semana
                </td>
              </tr>
            ) : (
              weeklyData.turns.map((turno, index) => (
                <tr
                  key={turno.id}
                  style={{
                    borderTop: index > 0 ? `1px solid ${theme.colors.gray[200]}` : "none",
                  }}
                >
                  <td style={{ padding: "16px", fontSize: "14px", color: theme.colors.neutral }}>
                    {turno.entryTime ? formatDateTime(turno.entryTime) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      fontSize: "14px",
                      color: turno.isOpen ? "#F59E0B" : theme.colors.neutral,
                    }}
                  >
                    {formatDateTime(turno.exitTime)}
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
