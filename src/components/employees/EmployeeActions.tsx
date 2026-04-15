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
    console.log("Ver asistencia:", employee.id);
  };

  return (
    <td style={{ padding: "16px", textAlign: "center" }}>
      <EditEmployeeButton employee={employee} />
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
        onClick={handleViewAttendance}
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
  );
}
