"use client";

import { useEffect, useState } from "react";
import { getEmployee } from "@/actions/employeeActions";
import { getEmployeeWeeklyTurns } from "@/actions/attendanceActions";

interface EmployeeData {
  id: number;
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

export default function HistoricoReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [turns, setTurns] = useState<Turno[]>([]);
  const [weekInfo, setWeekInfo] = useState<{ monday: string; sunday: string }>({ monday: "", sunday: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    params.then((p) => {
      setEmployeeId(parseInt(p.id));
    });
  }, [params]);

  useEffect(() => {
    if (!employeeId) return;

    async function fetchData() {
      if (!employeeId) return;
      
      setLoading(true);
      setError(null);

      const [empResult, turnsResult] = await Promise.all([
        getEmployee(employeeId),
        getEmployeeWeeklyTurns(employeeId),
      ]);

      if (empResult.success && empResult.data) {
        setEmployee(empResult.data);
      } else {
        setError(empResult.error || "Error al cargar empleado");
      }

      if (turnsResult.success && turnsResult.data) {
        setTurns(turnsResult.data.turns);
        setWeekInfo({ monday: turnsResult.data.monday, sunday: turnsResult.data.sunday });
      }

      setLoading(false);
    }

    fetchData();
  }, [employeeId]);

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

  let totalHours = 0;
  turns.forEach((turn) => {
    if (turn.entryTime && turn.exitTime) {
      const entry = new Date(turn.entryTime).getTime();
      const exit = new Date(turn.exitTime).getTime();
      totalHours += (exit - entry) / (1000 * 60 * 60);
    }
  });

  const weeklySalary = totalHours * employee.hourlyRate;

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ marginBottom: 20 }}>Reporte Histórico - {employee.lastName} {employee.name}</h1>
      
      <div style={{ marginBottom: 20 }}>
        <p><strong>Tarifa por Hora:</strong> ${employee.hourlyRate.toFixed(2)}</p>
        <p><strong>Total Horas:</strong> {totalHours.toFixed(2)}</p>
        <p><strong>Sueldo Semanal:</strong> ${weeklySalary.toFixed(2)}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <a
          href={`/api/reports/historico/${employee.id}`}
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
            <th style={thStyle}>Fecha</th>
            <th style={thStyle}>Entrada</th>
            <th style={thStyle}>Salida</th>
            <th style={thStyle}>Horas</th>
          </tr>
        </thead>
        <tbody>
          {turns.map((turn) => {
            let hours = 0;
            if (turn.entryTime && turn.exitTime) {
              const entry = new Date(turn.entryTime).getTime();
              const exit = new Date(turn.exitTime).getTime();
              hours = (exit - entry) / (1000 * 60 * 60);
            }
            const date = turn.entryTime ? new Date(turn.entryTime) : new Date();
            return (
              <tr key={turn.id}>
                <td style={tdStyle}>{date.toLocaleDateString("es-ES")}</td>
                <td style={tdStyle}>{turn.entryTime ? new Date(turn.entryTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                <td style={tdStyle}>{turn.exitTime ? new Date(turn.exitTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                <td style={tdStyle}>{turn.isOpen ? "Abierto" : `${hours.toFixed(2)}h`}</td>
              </tr>
            );
          })}
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
