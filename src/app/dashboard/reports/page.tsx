"use client";

import { useState, useEffect } from "react";
import { theme } from "@/lib/theme";
import { getEmployees } from "@/actions";

interface ReportCardProps {
  title: string;
  description: string;
  onClick: () => void;
}

function ReportCard({ title, description, onClick }: ReportCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.white,
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.2s",
        border: `2px solid transparent`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = theme.colors.primary;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <h3 style={{ color: theme.colors.neutral, fontSize: "18px", fontWeight: "bold", margin: "0 0 8px 0" }}>
        {title}
      </h3>
      <p style={{ color: theme.colors.gray[500], fontSize: "14px", margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

interface EmployeeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employeeId: number) => void;
}

function EmployeeSelector({ isOpen, onClose, onSelect }: EmployeeSelectorProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    async function fetchEmployees() {
      setLoading(true);
      const result = await getEmployees();
      if (result.success && result.data) {
        setEmployees(result.data);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.white,
          padding: "24px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: theme.colors.neutral, margin: "0 0 16px 0", fontSize: "18px", fontWeight: "bold" }}>
          Seleccionar Empleado
        </h3>
        {loading ? (
          <p style={{ color: theme.colors.gray[500] }}>Cargando...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => onSelect(emp.id)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.colors.gray[300]}`,
                  backgroundColor: theme.colors.white,
                  color: theme.colors.neutral,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                }}
              >
                {emp.lastName} {emp.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

  const handleHistoricoClick = () => {
    setShowEmployeeSelector(true);
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setShowEmployeeSelector(false);
    window.open(`/dashboard/reports/historico/${employeeId}`, "_blank");
  };

  const handleSemanalClick = () => {
    window.open("/dashboard/reports/semanal", "_blank");
  };

  const handleMensualClick = () => {
    window.open("/dashboard/reports/mensual", "_blank");
  };

  return (
    <div>
      <h2 style={{ color: theme.colors.neutral, marginBottom: "24px", fontSize: "24px", fontWeight: "bold" }}>
        Reportes
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <ReportCard
          title="Histórico de Empleado"
          description="Ver el historial completo de un empleado seleccionado, con detalle semanal y sueldo por semana."
          onClick={handleHistoricoClick}
        />
        <ReportCard
          title="Reporte Semanal"
          description="Resumen semanal de todos los empleados con horas trabajadas y sueldo de la semana."
          onClick={handleSemanalClick}
        />
        <ReportCard
          title="Reporte Mensual"
          description="Resumen mensual de todos los empleados con horas trabajadas y sueldo del mes."
          onClick={handleMensualClick}
        />
      </div>

      <EmployeeSelector
        isOpen={showEmployeeSelector}
        onClose={() => setShowEmployeeSelector(false)}
        onSelect={handleEmployeeSelect}
      />
    </div>
  );
}
