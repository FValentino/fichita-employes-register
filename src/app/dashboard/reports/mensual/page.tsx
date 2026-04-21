"use client";

import { useEffect, useState } from "react";
import { getEmployeesWithMonthlyTurns } from "@/actions/employeeActions";
import { PageTitle } from "@/components/PageTitle";
import { theme } from "@/lib/theme";

interface Turno {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

interface EmployeeSummary {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  turns: Turno[];
  totalHours: number;
  weeklySalary: number;
}

interface ReportData {
  employees: EmployeeSummary[];
  monthStart: string;
  monthEnd: string;
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

function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatMonthYearUpper(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
                  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function MensualReportPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getEmployeesWithMonthlyTurns();

      if (result.success && result.data) {
        setReportData(result.data as ReportData);
      } else {
        setError(result.error || "Error al cargar datos");
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Cargando reporte mensual...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "red" }}>{error || "Error al cargar datos"}</p>
      </div>
    );
  }

  const employeesWithAttendance = reportData.employees.filter((e) => e.totalHours > 0);
  const employeesWithoutAttendance = reportData.employees.filter((e) => e.totalHours === 0);

  const totalMinutes = reportData.employees.reduce((sum, e) => sum + e.totalHours * 60, 0);
  const totalSalary = reportData.employees.reduce((sum, e) => sum + e.weeklySalary, 0);
  const totalWorkDays = employeesWithAttendance.reduce((sum, e) => sum + getUniqueWorkDays(e.turns), 0);

  return (
    <div style={{ padding: 40 }}>
      <PageTitle>REPORTE MENSUAL {formatMonthYearUpper(reportData.monthStart)}</PageTitle>
      <p style={{ marginBottom: 8, color: "#666", fontSize: "16px" }}>
        Período: {formatFullDate(reportData.monthStart)} - {formatFullDate(reportData.monthEnd)}
      </p>
      <p style={{ marginBottom: 24, color: "#666", fontSize: "12px" }}>
        Emitido: {new Date().toLocaleDateString("es-ES")}
      </p>
      
      <div style={{ marginBottom: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
        <p style={{ margin: "4px 0" }}>
          <strong>Empleados activos:</strong> {reportData.employees.length}
        </p>
        <p style={{ margin: "4px 0" }}>
          <strong>Empleados con asistencia:</strong> {employeesWithAttendance.length}
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <a
          href="/api/reports/mensual"
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
              <th style={thStyleHeaderLeft}>Empleado</th>
              <th style={thStyleHeader}>Días</th>
              <th style={thStyleHeader}>Horas trabajadas</th>
              <th style={thStyleHeader}>Sueldo</th>
            </tr>
          </thead>
          <tbody>
            {employeesWithAttendance.map((emp) => {
              const workDays = getUniqueWorkDays(emp.turns);
              return (
                <tr key={emp.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyleLeft}>{emp.lastName} {emp.name}</td>
                  <td style={tdStyleCenter}>{workDays}</td>
                  <td style={tdStyleCenter}>{formatMinutes(emp.totalHours * 60)}</td>
                  <td style={tdStyleCenter}>${emp.weeklySalary.toFixed(2)} ARS</td>
                </tr>
              );
            })}
            <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <td style={{ ...tdStyleLeft, backgroundColor: "#e0e0e0" }}>TOTALES</td>
              <td style={{ ...tdStyleCenter, backgroundColor: "#e0e0e0" }}>{totalWorkDays}</td>
              <td style={{ ...tdStyleCenter, backgroundColor: "#e0e0e0" }}>{formatMinutes(totalMinutes)}</td>
              <td style={{ ...tdStyleCenter, backgroundColor: "#e0e0e0" }}>${totalSalary.toFixed(2)} ARS</td>
            </tr>
          </tbody>
        </table>
      </div>

      {employeesWithoutAttendance.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, backgroundColor: "#fff3e0", borderRadius: 8, borderLeft: "4px solid" + theme.colors.secondary }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: theme.colors.neutral }}>
            Empleados sin asistencia
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {employeesWithoutAttendance.map((emp) => (
              <li key={emp.id} style={{ margin: "4px 0", color: theme.colors.neutral }}>
                {emp.lastName} {emp.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8, borderLeft: "4px solid" + theme.colors.primary }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: theme.colors.neutral }}>Resumen</h3>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Total días trabajados:</strong> {totalWorkDays}
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px" }}>
          <strong>Total horas trabajadas:</strong> {formatMinutes(totalMinutes)}
        </p>
        <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "bold" }}>
          <strong>Sueldo total a pagar:</strong> ${totalSalary.toFixed(2)} ARS
        </p>
      </div>
    </div>
  );
}

const thStyleHeader: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "center",
  color: theme.colors.neutral,
  fontSize: "14px",
  fontWeight: "bold",
};

const thStyleHeaderLeft: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: theme.colors.neutral,
  fontSize: "14px",
  fontWeight: "bold",
};

const tdStyleLeft: React.CSSProperties = {
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
