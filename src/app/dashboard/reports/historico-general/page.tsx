"use client";

import { useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { theme } from "@/lib/theme";

const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

export default function HistoricoGeneralPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const startYear = currentYear - 1;
  const years = [startYear, currentYear];

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [downloading, setDownloading] = useState(false);

  const availableMonths = selectedYear === currentYear
    ? months.filter(m => m.value < currentMonth)
    : months;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = `historico_general_${months[selectedMonth - 1].label}_${selectedYear}.pdf`;

      const response = await fetch(`/api/reports/historico-general?month=${selectedMonth}&year=${selectedYear}`);

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
        const errorData = await response.json();
        alert("Error al generar el reporte: " + (errorData.error || "Error desconocido"));
      }
    } catch (error) {
      alert("Error al generar el reporte");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <PageTitle>Histórico General</PageTitle>
      <p style={{ marginBottom: 24, color: "#666" }}>
        Seleccione el mes y año para generar un reporte de todos los empleados
      </p>

      <div style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 24,
        maxWidth: 500,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: theme.colors.neutral }}>
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                const newYear = parseInt(e.target.value);
                setSelectedYear(newYear);
                if (newYear === currentYear) {
                  const newMonth = Math.min(selectedMonth, currentMonth - 1);
                  setSelectedMonth(newMonth > 0 ? newMonth : 12);
                }
              }}
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

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: "bold", color: theme.colors.neutral }}>
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #d4d4d4",
                fontSize: "14px",
                backgroundColor: "#fff",
              }}
            >
              {availableMonths.length === 0 ? (
                <option value="">No hay meses disponibles</option>
              ) : (
                availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {availableMonths.length === 0 && (
          <p style={{ color: "#666", fontSize: "14px", marginBottom: 16 }}>
            Para el año {currentYear}, solo se pueden consultar meses anteriores al actual.
          </p>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || availableMonths.length === 0}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: availableMonths.length > 0 && !downloading ? theme.colors.secondary : "#ccc",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: availableMonths.length > 0 && !downloading ? "pointer" : "not-allowed",
          }}
        >
          {downloading ? "Generando..." : "Descargar PDF"}
        </button>
      </div>
    </div>
  );
}
