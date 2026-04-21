"use client";

import { useEffect, useState } from "react";
import { getEmployees } from "@/actions";
import { PageTitle } from "@/components/PageTitle";
import { theme } from "@/lib/theme";

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
    <div style={{ padding: 40 }}>
      <PageTitle>Histórico de Turnos</PageTitle>
      <p style={{ marginBottom: 24, color: "#666" }}>
        Seleccione un empleado y el período que desea consultar
      </p>

      <div style={{ 
        backgroundColor: "#fff", 
        borderRadius: 12, 
        padding: 24, 
        maxWidth: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: theme.colors.neutral }}>
            Empleado
          </label>
          <select
            value={selectedEmployee || ""}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #d4d4d4",
              fontSize: "14px",
              backgroundColor: "#fff",
            }}
          >
            <option value="">Seleccionar empleado...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.lastName} {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: theme.colors.neutral }}>
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #d4d4d4",
                fontSize: "14px",
                backgroundColor: "#fff",
              }}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: theme.colors.neutral }}>
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #d4d4d4",
                fontSize: "14px",
                backgroundColor: "#fff",
              }}
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
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: selectedEmployee && selectedMonth && selectedYear && !downloading ? theme.colors.secondary : "#ccc",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: selectedEmployee && selectedMonth && selectedYear && !downloading ? "pointer" : "not-allowed",
          }}
        >
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>
    </div>
  );
}
