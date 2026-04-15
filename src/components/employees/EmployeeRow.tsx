"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/actions";
import { theme } from "@/lib/theme";
import { AttendanceHistory } from "@/components/attendance";

interface Employee {
  id: number;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
}

interface EmployeeRowProps {
  employee: Employee;
  showEditForm: boolean;
  onEditClick: () => void;
  onEditClose: () => void;
}

export function EmployeeRow({ employee, showEditForm, onEditClick, onEditClose }: EmployeeRowProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de eliminar este empleado?")) {
      const result = await deleteEmployee(employee.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Error al eliminar");
      }
    }
  };

  return (
    <>
      <tr
        style={{
          borderTop: "1px solid #E5E5E5",
        }}
      >
        <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
          {employee.lastName}
        </td>
        <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
          {employee.name}
        </td>
        <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
          {employee.weeklyHours} hs
        </td>
        <td style={{ padding: "16px", textAlign: "center" }}>
          <button
            onClick={onEditClick}
            style={{
              background: "none",
              border: "none",
              color: theme.colors.primary,
              fontSize: "13px",
              cursor: "pointer",
              marginRight: "16px",
              textDecoration: "underline",
            }}
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: "none",
              border: "none",
              color: "#EF4444",
              fontSize: "13px",
              cursor: "pointer",
              marginRight: "16px",
              textDecoration: "underline",
            }}
          >
            Eliminar
          </button>
          <button
            onClick={onEditClick}
            style={{
              background: "none",
              border: "none",
              color: theme.colors.primary,
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Ver asistencia
          </button>
        </td>
      </tr>

      {showEditForm && (
        <EditFormInline
          employee={employee}
          isOpen={showEditForm}
          onClose={onEditClose}
        />
      )}
    </>
  );
}

function EditFormInline({
  employee,
  isOpen,
  onClose,
}: {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <tr>
      <td colSpan={4} style={{ padding: 0 }}>
        <div
          style={{
            backgroundColor: theme.colors.gray[100],
            padding: "16px",
            borderBottom: "1px solid #E5E5E5",
          }}
        >
          Formulario de edición para {employee.name}
          <button onClick={onClose}>Cerrar</button>
        </div>
      </td>
    </tr>
  );
}
