"use client";

import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/actions";
import { theme } from "@/lib/theme";

interface EmployeeActionsProps {
  id: number;
}

export function EmployeeActions({ id }: EmployeeActionsProps) {
  const router = useRouter();

  const handleEdit = () => {
    console.log("Editar empleado:", id);
  };

  const handleDelete = async () => {
    if (confirm("¿Estás seguro de eliminar este empleado?")) {
      const result = await deleteEmployee(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Error al eliminar");
      }
    }
  };

  const handleViewAttendance = () => {
    console.log("Ver asistencia:", id);
  };

  return (
    <td style={{ padding: "16px", textAlign: "center" }}>
      <button
        onClick={handleEdit}
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
