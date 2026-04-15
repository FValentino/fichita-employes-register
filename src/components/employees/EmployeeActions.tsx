"use client";

import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/actions";
import { theme } from "@/lib/theme";
import { EditEmployeeButton } from "./EditEmployeeButton";

interface Employee {
  id: number;
  name: string;
  lastName: string;
  hourlyRate: number;
}

interface EmployeeActionsProps {
  employee: Employee;
}

export function EmployeeActions({ employee }: EmployeeActionsProps) {
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

  const handleViewAttendance = () => {
    router.push(`/dashboard/attendance/${employee.id}`);
  };

  return (
    <td style={{ padding: "16px", textAlign: "center" }}>
      <EditEmployeeButton employee={employee} />
      <button
        onClick={handleDelete}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: `1px solid #EF4444`,
          backgroundColor: theme.colors.white,
          color: "#EF4444",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          marginRight: "8px",
        }}
      >
        Eliminar
      </button>
      <button
        onClick={handleViewAttendance}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: `1px solid ${theme.colors.primary}`,
          backgroundColor: theme.colors.white,
          color: theme.colors.neutral,
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
        }}
      >
        Ver asistencia
      </button>
    </td>
  );
}
