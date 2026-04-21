"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/actions";
import { theme } from "@/lib/theme";
import { EditEmployeeButton } from "./EditEmployeeButton";
import { AttendanceHistory } from "@/components/attendance";

interface Employee {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
}

interface EmployeeWithAttendanceProps {
  employee: Employee;
}

export function EmployeeWithAttendance({ employee }: EmployeeWithAttendanceProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
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
            onClick={() => setShowEdit(true)}
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
            onClick={() => setShowHistory(true)}
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

      {showEdit && (
        <EditEmployeeButton employee={employee} />
      )}

      <AttendanceHistory
        employeeId={employee.id}
        employeeName={employee.name}
        employeeLastName={employee.lastName}
        hourlyRate={employee.hourlyRate}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
}
