"use client";

import { useState } from "react";
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
      className="bg-white p-4 md:p-6 rounded-xl shadow-sm cursor-pointer border-2 border-transparent hover:border-amber-500 hover:-translate-y-0.5 transition-all"
    >
      <h3 className="text-base md:text-lg font-bold text-gray-800 m-0 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm m-0">{description}</p>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 md:p-8 rounded-2xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
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
    <div className="p-4">
      <PageTitle>Reportes</PageTitle>

      <div className="flex flex-col gap-4">
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
        <h2 className="text-xl font-bold text-gray-800 m-0 mb-2 text-center">
          Reportes Generales Actuales
        </h2>
        <p className="text-gray-500 text-sm m-0 mb-6 text-center">
          Seleccione el tipo de reporte que desea generar
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleDownloadReport("semanal")}
            disabled={downloading}
            className={`w-full py-4 rounded-lg border-none text-base font-bold cursor-pointer flex flex-col items-center gap-1 ${
              downloading ? "bg-gray-300 cursor-not-allowed" : "bg-amber-500 text-neutral-900 hover:bg-amber-600"
            }`}
          >
            {downloading && downloadType === "semanal" ? (
              "Generando..."
            ) : (
              <>
                <span>Semana Actual</span>
                <span className="text-xs font-normal">
                  {formatDate(monday)} - {formatDate(sunday)}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDownloadReport("mensual")}
            disabled={downloading}
            className={`w-full py-4 rounded-lg border-none text-base font-bold cursor-pointer flex flex-col items-center gap-1 ${
              downloading ? "bg-gray-300 cursor-not-allowed" : "bg-amber-500 text-neutral-900 hover:bg-amber-600"
            }`}
          >
            {downloading && downloadType === "mensual" ? (
              "Generando..."
            ) : (
              <>
                <span>Mes Actual</span>
                <span className="text-xs font-normal">
                  {getMonthName(currentMonth)} {currentYear}
                </span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowCurrentReportsPopup(false)}
          className="w-full mt-4 py-3 bg-transparent text-gray-500 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50"
        >
          Cancelar
        </button>
      </Popup>
    </div>
  );
}