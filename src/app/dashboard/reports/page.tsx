"use client";

import { theme } from "@/lib/theme";
import { PageTitle } from "@/components/PageTitle";

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

export default function ReportsPage() {
  const handleHistoricoClick = () => {
    window.location.href = "/dashboard/reports/historico";
  };

  const handleSemanalClick = () => {
    window.location.href = "/dashboard/reports/semanal";
  };

  const handleMensualClick = () => {
    window.location.href = "/dashboard/reports/mensual";
  };

  return (
    <div>
      <PageTitle>Reportes</PageTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <ReportCard
          title="Histórico de Empleado"
          description="Ver el historial completo de un empleado seleccionado, con detalle mensual y sueldo."
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
    </div>
  );
}
