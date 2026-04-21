"use client";

import { useEffect, useState } from "react";
import { getEmployees } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

interface Employee {
  id: string;
  name: string;
  lastName: string;
}

export default function HistoricoSelectionPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getEmployees();
      if (result.success && result.data) {
        setEmployees(result.data);
      }
      setLoading(false);
    }
    fetchData();

    const now = new Date();
    setSelectedMonth(String(now.getMonth() + 1));
    setSelectedYear(String(now.getFullYear()));
  }, []);

  const handleGenerar = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear) return;
    
    setDownloading(true);
    try {
      const selectedEmp = employees.find(e => e.id === selectedEmployee);
      const filename = `historico_${selectedEmp?.lastName || 'empleado'}_${selectedMonth}_${selectedYear}.pdf`;
      
      const response = await fetch(`/api/reports/historico/${selectedEmployee}?month=${selectedMonth}&year=${selectedYear}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Error al generar el reporte");
      }
    } catch (error) {
      alert("Error al generar el reporte");
    } finally {
      setDownloading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  return (
    <div className="p-4 md:p-10">
      <PageTitle>Histórico de Turnos</PageTitle>
      <p className="mb-6 text-gray-600">
        Seleccione un empleado y el período que desea consultar
      </p>

      <div className="bg-white rounded-xl p-6 max-w-md shadow-sm">
        <div className="mb-5">
          <label className="block mb-2 font-semibold text-gray-800">
            Empleado
          </label>
          <select
            value={selectedEmployee || ""}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="">Seleccionar empleado...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.lastName} {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block mb-2 font-semibold text-gray-800">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm bg-white"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block mb-2 font-semibold text-gray-800">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-gray-300 text-sm bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerar}
          disabled={!selectedEmployee || !selectedMonth || !selectedYear || downloading}
          className={`w-full py-3.5 rounded-lg text-base font-bold ${
            selectedEmployee && selectedMonth && selectedYear && !downloading
              ? "bg-amber-500 text-neutral-900 cursor-pointer hover:bg-amber-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>
    </div>
  );
}