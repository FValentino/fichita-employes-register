"use client";

import { useEffect, useState } from "react";
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

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function Popup({ isOpen, onClose, children }: PopupProps) {
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
          padding: "32px",
          borderRadius: "16px",
          maxWidth: "450px",
          width: "90%",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function getWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getMonthName(month: number): string {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return months[month];
}

export default function ReportsPage() {
  const [showCurrentReportsPopup, setShowCurrentReportsPopup] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<string | null>(null);

  const { monday, sunday } = getWeekRange();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const handleHistoricoEmpleadoClick = () => {
    window.location.href = "/dashboard/reports/historico";
  };

  const handleHistoricoGeneralClick = () => {
    window.location.href = "/dashboard/reports/historico-general";
  };

  const handleDownloadReport = async (type: "semanal" | "mensual") => {
    setDownloading(true);
    setDownloadType(type);

    try {
      const endpoint = type === "semanal" ? "/api/reports/semanal" : "/api/reports/mensual";
      const filename = type === "semanal" 
        ? `reporte_semanal_${formatDate(monday).replace(/\//g, "-")}.pdf`
        : `reporte_mensual_${getMonthName(currentMonth)}_${currentYear}.pdf`;

      const response = await fetch(endpoint);

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
      setDownloadType(null);
      setShowCurrentReportsPopup(false);
    }
  };

  return (
    <div>
      <PageTitle>Reportes</PageTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <ReportCard
          title="Histórico de Empleado"
          description="Ver el historial completo de un empleado seleccionado, con detalle mensual y sueldo."
          onClick={handleHistoricoEmpleadoClick}
        />

        <ReportCard
          title="Reportes Generales Actuales"
          description="Generar reportes de la semana o mes actual para todos los empleados."
          onClick={() => setShowCurrentReportsPopup(true)}
        />

        <ReportCard
          title="Histórico General"
          description="Ver el historial de todos los empleados de un mes específico."
          onClick={handleHistoricoGeneralClick}
        />
      </div>

      <Popup isOpen={showCurrentReportsPopup} onClose={() => setShowCurrentReportsPopup(false)}>
        <h2 style={{ color: theme.colors.neutral, fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0", textAlign: "center" }}>
          Reportes Generales Actuales
        </h2>
        <p style={{ color: theme.colors.gray[500], fontSize: "14px", margin: "0 0 24px 0", textAlign: "center" }}>
          Seleccione el tipo de reporte que desea generar
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            onClick={() => handleDownloadReport("semanal")}
            disabled={downloading}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: downloading ? "#ccc" : theme.colors.secondary,
              color: "#000",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: downloading ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {downloading && downloadType === "semanal" ? (
              "Generando..."
            ) : (
              <>
                <span>Semana Actual</span>
                <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                  {formatDate(monday)} - {formatDate(sunday)}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownloadReport("mensual")}
            disabled={downloading}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: downloading ? "#ccc" : theme.colors.secondary,
              color: "#000",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: downloading ? "not-allowed" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {downloading && downloadType === "mensual" ? (
              "Generando..."
            ) : (
              <>
                <span>Mes Actual</span>
                <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                  {getMonthName(currentMonth)} {currentYear}
                </span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowCurrentReportsPopup(false)}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "transparent",
            color: theme.colors.gray[500],
            border: `1px solid ${theme.colors.gray[300]}`,
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </Popup>
    </div>
  );
}
