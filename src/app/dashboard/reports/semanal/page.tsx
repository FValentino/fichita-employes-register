"use client";

import { useEffect, useState } from "react";
import { getEmployeesWithWeeklyTurns } from "@/actions/employeeActions";

interface Turno {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

interface EmployeeSummary {
  id: number;
  name: string;
  lastName: string;
  hourlyRate: number;
  turns: Turno[];
  totalHours: number;
  weeklySalary: number;
}

interface ReportData {
  employees: EmployeeSummary[];
  weekStart: string;
  weekEnd: string;
}

export default function SemanalReportPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getEmployeesWithWeeklyTurns();

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
        <p>Cargando reporte semanal...</p>
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

  const totalHours = reportData.employees.reduce((sum, e) => sum + e.totalHours, 0);
  const totalSalary = reportData.employees.reduce((sum, e) => sum + e.weeklySalary, 0);

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ marginBottom: 20 }}>Reporte Semanal</h1>
      
      <div style={{ marginBottom: 20 }}>
        <p><strong>Período:</strong> {new Date(reportData.weekStart).toLocaleDateString("es-ES")} - {new Date(reportData.weekEnd).toLocaleDateString("es-ES")}</p>
        <p><strong>Total Empleados:</strong> {reportData.employees.length}</p>
        <p><strong>Total Horas:</strong> {totalHours.toFixed(2)}</p>
        <p><strong>Total Sueldos:</strong> ${totalSalary.toFixed(2)}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <a
          href="/api/reports/semanal"
          style={{
            textDecoration: "none",
            padding: "10px 20px",
            color: "#000",
            backgroundColor: "#0070f3",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            display: "inline-block",
          }}
        >
          Descargar PDF
        </a>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={thStyle}>Empleado</th>
            <th style={thStyle}>Tarifa/Hora</th>
            <th style={thStyle}>Horas</th>
            <th style={thStyle}>Sueldo</th>
          </tr>
        </thead>
        <tbody>
          {reportData.employees.map((emp) => (
            <tr key={emp.id}>
              <td style={tdStyle}>{emp.lastName} {emp.name}</td>
              <td style={tdStyle}>${emp.hourlyRate.toFixed(2)}</td>
              <td style={tdStyle}>{emp.totalHours.toFixed(2)}</td>
              <td style={tdStyle}>${emp.weeklySalary.toFixed(2)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: "bold", backgroundColor: "#fafafa" }}>
            <td style={tdStyle}>TOTAL</td>
            <td style={tdStyle}></td>
            <td style={tdStyle}>{totalHours.toFixed(2)}</td>
            <td style={tdStyle}>${totalSalary.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
};
