"use client";

import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import { theme } from "@/lib/theme";

interface Turno {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

interface AttendanceHistoryProps {
  employeeId: number;
  employeeName: string;
  employeeLastName: string;
  hourlyRate: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AttendanceHistory({
  employeeId,
  employeeName,
  employeeLastName,
  hourlyRate,
  isOpen,
  onClose,
}: AttendanceHistoryProps) {
  const [turnos] = useState<Turno[]>([]);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "Turno en proceso";
    return `${formatDate(date)} ${date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const calculateSalary = () => {
    let totalHours = 0;
    turnos.forEach((turno) => {
      if (turno.entryTime && turno.exitTime) {
        const hours = (turno.exitTime.getTime() - turno.entryTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });
    return (totalHours * hourlyRate).toFixed(2);
  };

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
          borderRadius: "12px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#EF4444",
            fontSize: "20px",
            padding: "4px",
          }}
        >
          <FaTimes />
        </button>

        <h2
          style={{
            color: theme.colors.neutral,
            marginTop: 0,
            marginBottom: "8px",
            fontSize: "20px",
            fontWeight: "bold",
            paddingRight: "24px",
          }}
        >
          Asistencia desde {formatDate(monday)} hasta {formatDate(sunday)}
        </h2>

        <p
          style={{
            color: theme.colors.gray[500],
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          Sueldo hasta hoy: <strong>${calculateSalary()}</strong>
        </p>

        <div
          style={{
            backgroundColor: "#FEF3C7",
            padding: "8px 12px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <p style={{ color: "#92400E", fontSize: "12px", margin: 0 }}>
            Para el sueldo no se tiene en cuenta el turno en proceso
          </p>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: theme.colors.gray[100] }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  color: theme.colors.gray[500],
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Inicio del turno
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  color: theme.colors.gray[500],
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Fin del turno
              </th>
            </tr>
          </thead>
          <tbody>
            {turnos.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: theme.colors.gray[500],
                  }}
                >
                  No hay registros esta semana
                </td>
              </tr>
            ) : (
              turnos.map((turno, index) => (
                <tr
                  key={turno.id}
                  style={{
                    borderTop: index > 0 ? `1px solid ${theme.colors.gray[200]}` : "none",
                  }}
                >
                  <td style={{ padding: "12px", fontSize: "14px", color: theme.colors.neutral }}>
                    {turno.entryTime ? formatDateTime(turno.entryTime) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      color: turno.isOpen ? "#F59E0B" : theme.colors.neutral,
                    }}
                  >
                    {formatDateTime(turno.exitTime)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
