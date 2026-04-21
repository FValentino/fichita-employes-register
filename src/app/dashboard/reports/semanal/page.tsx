"use client";

import { useEffect, useState } from "react";
import { getEmployeesWithWeeklyTurns } from "@/actions/employeeActions";
import { PageTitle } from "@/components/PageTitle";

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
  weekStart: string;
  weekEnd: string;
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

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
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
      <div className="p-4 md:p-10 text-center">
        <p>Cargando reporte semanal...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-4 md:p-10 text-center">
        <p className="text-red-500">{error || "Error al cargar datos"}</p>
      </div>
    );
  }

  const employeesWithAttendance = reportData.employees.filter((e) => e.totalHours > 0);
  const employeesWithoutAttendance = reportData.employees.filter((e) => e.totalHours === 0);

  const totalMinutes = reportData.employees.reduce((sum, e) => sum + e.totalHours * 60, 0);
  const totalSalary = reportData.employees.reduce((sum, e) => sum + e.weeklySalary, 0);
  const totalWorkDays = employeesWithAttendance.reduce((sum, e) => sum + getUniqueWorkDays(e.turns), 0);

  return (
    <div className="p-4 md:p-10">
      <PageTitle>REPORTE SEMANAL</PageTitle>
      <p className="mb-2 text-gray-600 text-base md:text-lg">
        Semana: {formatFullDate(reportData.weekStart)} - {formatFullDate(reportData.weekEnd)}
      </p>
      <p className="mb-6 text-gray-500 text-xs md:text-sm">
        Emitido: {new Date().toLocaleDateString("es-ES")}
      </p>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="m-1"><strong>Empleados activos:</strong> {reportData.employees.length}</p>
        <p className="m-1"><strong>Empleados con asistencia:</strong> {employeesWithAttendance.length}</p>
      </div>

      <div className="mb-5">
        <a
          href="/api/reports/semanal"
          className="inline-block px-6 py-3 bg-amber-500 text-neutral-900 rounded-lg cursor-pointer text-base font-bold hover:bg-amber-600 transition-colors no-underline"
        >
          Descargar PDF
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-amber-500">
                <th className="p-3 md:p-4 text-left text-gray-800 text-sm font-bold">Empleado</th>
                <th className="p-3 md:p-4 text-center text-gray-800 text-sm font-bold">Días</th>
                <th className="p-3 md:p-4 text-center text-gray-800 text-sm font-bold">Horas trabajadas</th>
                <th className="p-3 md:p-4 text-center text-gray-800 text-sm font-bold">Sueldo</th>
              </tr>
            </thead>
            <tbody>
              {employeesWithAttendance.map((emp) => {
                const workDays = getUniqueWorkDays(emp.turns);
                return (
                  <tr key={emp.id} className="border-b border-gray-100">
                    <td className="p-3 md:p-4 text-left text-gray-700 text-sm">{emp.lastName} {emp.name}</td>
                    <td className="p-3 md:p-4 text-center text-gray-700 text-sm">{workDays}</td>
                    <td className="p-3 md:p-4 text-center text-gray-700 text-sm">{formatMinutes(emp.totalHours * 60)}</td>
                    <td className="p-3 md:p-4 text-center text-gray-700 text-sm">${emp.weeklySalary.toFixed(2)} ARS</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-200 font-bold">
                <td className="p-3 md:p-4 text-left bg-gray-300">TOTALES</td>
                <td className="p-3 md:p-4 text-center bg-gray-300">{totalWorkDays}</td>
                <td className="p-3 md:p-4 text-center bg-gray-300">{formatMinutes(totalMinutes)}</td>
                <td className="p-3 md:p-4 text-center bg-gray-300">${totalSalary.toFixed(2)} ARS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {employeesWithoutAttendance.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
          <h3 className="m-0 mb-3 text-base text-gray-800 font-semibold">Empleados sin asistencia</h3>
          <ul className="m-0 pl-5">
            {employeesWithoutAttendance.map((emp) => (
              <li key={emp.id} className="m-1 text-gray-700">{emp.lastName} {emp.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-amber-500">
        <h3 className="m-0 mb-3 text-base text-gray-800 font-semibold">Resumen</h3>
        <p className="m-1 text-sm"><strong>Total días trabajados:</strong> {totalWorkDays}</p>
        <p className="m-1 text-sm"><strong>Total horas trabajadas:</strong> {formatMinutes(totalMinutes)}</p>
        <p className="m-1 text-sm font-bold"><strong>Sueldo total a pagar:</strong> ${totalSalary.toFixed(2)} ARS</p>
      </div>
    </div>
  );
}
