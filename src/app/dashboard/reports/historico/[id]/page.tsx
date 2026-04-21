"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getEmployee } from "@/actions/employeeActions";
import { getEmployeeMonthlyTurns } from "@/actions/attendanceActions";
import { PageTitle } from "@/components/PageTitle";
import { theme } from "@/lib/theme";

interface EmployeeData {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
}

interface Turno {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

function getUniqueWorkDays(turns: Turno[]): number {
  const days = new Set<string>();
  turns.forEach((turn) => {
    if (turn.entryTime) {
      const date = new Date(turn.entryTime);
      days.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    }
  });
  return days.size;
}

function formatMonthYear(month: number, year: number): string {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[month - 1]} ${year}`;
}

function formatMonthYearUpper(month: number, year: number): string {
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
                  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  return `${months[month - 1]} ${year}`;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getDaysInMonth(month: number, year: number): { first: Date; last: Date } {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  last.setHours(23, 59, 59, 999);
  return { first, last };
}

function HistoricoContent() {
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get("id");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  // Si no hay parámetros, redirigir a la página de selección
  useEffect(() => {
    if (!employeeIdParam) {
      window.location.href = "/dashboard/reports/historico";
    }
  }, [employeeIdParam]);

  if (!employeeIdParam || !monthParam || !yearParam) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Redirigiendo...</p>
      </div>
    );
  }

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [turns, setTurns] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeIdParam || !monthParam || !yearParam) {
      setError("Parámetros inválidos");
      setLoading(false);
      return;
    }

const empId = employeeIdParam;
    const month = parseInt(monthParam || String(new Date().getMonth() + 1));
    const year = parseInt(yearParam || String(new Date().getFullYear()));

    async function fetchData() {
      setLoading(true);
      setError(null);

      const [empResult, turnsResult] = await Promise.all([
        getEmployee(empId),
        getEmployeeMonthlyTurns(empId, month, year),
      ]);

      if (empResult.success && empResult.data) {
        setEmployee(empResult.data);
      } else {
        setError(empResult.error || "Error al cargar empleado");
      }

      if (turnsResult.success && turnsResult.data) {
        setTurns(turnsResult.data.turns);
      }

      setLoading(false);
    }

    fetchData();
  }, [employeeIdParam, monthParam, yearParam]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Cargando datos del empleado...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "red" }}>{error || "Empleado no encontrado"}</p>
      </div>
    );
  }

  const month = parseInt(monthParam || "1");
  const year = parseInt(yearParam || "2026");
  const { first: firstDay, last: lastDay } = getDaysInMonth(month, year);

  let totalMinutes = 0;
  turns.forEach((turn) => {
    if (turn.entryTime && turn.exitTime) {
      const entry = new Date(turn.entryTime).getTime();
      const exit = new Date(turn.exitTime).getTime();
      totalMinutes += (exit - entry) / (1000 * 60);
    }
  });

  const weeklySalary = (totalMinutes / 60) * employee.hourlyRate;
  const workDays = getUniqueWorkDays(turns);
  const avgPerDay = workDays > 0 ? totalMinutes / workDays : 0;
  const totalSalary = weeklySalary;

  return (
    <div style={{ padding: 40 }}>
      <PageTitle>Histórico de Turnos - {employee.lastName} {employee.name}</PageTitle>
      <p style={{ marginBottom: 8, color: "#666", fontSize: "16px" }}>
        Período: {formatFullDate(firstDay.toISOString())} - {formatFullDate(lastDay.toISOString())}
      </p>
      <p style={{ marginBottom: 24, color: "#666", fontSize: "12px" }}>
        Emitido: {new Date().toLocaleDateString("es-ES")}
      </p>

      <div style={{ marginBottom: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
        <p style={{ margin: "4px 0" }}>
          <strong>Tarifa por Hora:</strong> ${employee.hourlyRate.toFixed(2)} ARS
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Días Trabajados:</strong> {workDays}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Total Horas:</strong> {formatMinutes(totalMinutes)}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Sueldo Total:</strong> ${totalSalary.toFixed(2)} ARS
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <a
          href={`/api/reports/historico/${employee.id}?month=${month}&year=${year}`}
          style={{
            textDecoration: "none",
            padding: "12px 24px",
            color: "#000",
            backgroundColor: theme.colors.secondary,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          Descargar PDF
        </a>
      </div>

      <div style={{ backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: theme.colors.primary }}>
              <th style={thStyleHeader}>Fecha</th>
              <th style={thStyleHeader}>Entrada</th>
              <th style={thStyleHeader}>Salida</th>
              <th style={thStyleHeader}>Duración</th>
            </tr>
          </thead>
          <tbody>
            {turns.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#666" }}>
                  No hay registros en este período
                </td>
              </tr>
            ) : (
              turns.map((turn) => {
                let minutes = 0;
                if (turn.entryTime && turn.exitTime) {
                  const entry = new Date(turn.entryTime).getTime();
                  const exit = new Date(turn.exitTime).getTime();
                  minutes = (exit - entry) / (1000 * 60);
                }
                const date = turn.entryTime ? new Date(turn.entryTime) : new Date();
                return (
                  <tr key={turn.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={tdStyle}>{date.toLocaleDateString("es-ES")}</td>
                    <td style={tdStyleCenter}>
                      {turn.entryTime ? new Date(turn.entryTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td style={tdStyleCenter}>
                      {turn.exitTime ? new Date(turn.exitTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td style={tdStyleCenter}>
                      {turn.isOpen ? "Abierto" : formatMinutes(minutes)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8, borderLeft: "4px solid" + theme.colors.primary }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: theme.colors.neutral }}>TOTALES</h3>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Días trabajados:</strong> {workDays}
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Total horas:</strong> {formatMinutes(totalMinutes)}
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Total sueldos:</strong> ${totalSalary.toFixed(2)} ARS
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Promedio por empleado:</strong> {formatMinutes(avgPerDay)}
        </p>
      </div>
    </div>
  );
}

export default function HistoricoReportPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Cargando...</div>}>
      <HistoricoContent />
    </Suspense>
  );
}

const thStyleHeader: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "center",
  color: theme.colors.neutral,
  fontSize: "14px",
  fontWeight: "bold",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: theme.colors.neutral,
  fontSize: "14px",
};

const tdStyleCenter: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "center",
  color: theme.colors.neutral,
  fontSize: "14px",
};
