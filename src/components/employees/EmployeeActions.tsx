"use client";

import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/actions";
import { EditEmployeeButton } from "./EditEmployeeButton";
import { AssignTurnsButton } from "./AssignTurnsButton";
import { InviteEmployeeButton } from "./InviteEmployeeButton";

interface Employee {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  email?: string | null;
  authUserId?: string | null;
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
    <div className="flex gap-2 flex-wrap">
      <EditEmployeeButton employee={employee} />
      <AssignTurnsButton employee={employee} />
      <InviteEmployeeButton employee={employee} />
      <button
        onClick={handleDelete}
        className="px-3 py-1.5 rounded-md border border-red-500 bg-white text-red-500 text-xs font-medium cursor-pointer hover:bg-red-50 transition-colors"
      >
        Eliminar
      </button>
      <button
        onClick={handleViewAttendance}
        className="px-3 py-1.5 rounded-md border border-amber-500 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-amber-50 transition-colors"
      >
        Ver asistencia
      </button>
    </div>
  );
}