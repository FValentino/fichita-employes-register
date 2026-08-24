"use client";

import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/actions";
import { EditEmployeeButton } from "./EditEmployeeButton";
import { AssignTurnsButton } from "./AssignTurnsButton";

interface Employee {
  id: string;
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
    <>
      {/* Mobile */}
      <td className="p-4 md:hidden">
        <div className="flex gap-2 justify-end">
          <EditEmployeeButton employee={employee} />
          <AssignTurnsButton employee={employee} />
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
            Ver
          </button>
        </div>
      </td>

      {/* Desktop */}
      <td className="hidden md:table-cell p-4 text-center">
        <EditEmployeeButton employee={employee} />
        <AssignTurnsButton employee={employee} />
        <button
          onClick={handleDelete}
          className="mx-1 px-3 py-1.5 rounded-md border border-red-500 bg-white text-red-500 text-xs font-medium cursor-pointer hover:bg-red-50 transition-colors"
        >
          Eliminar
        </button>
        <button
          onClick={handleViewAttendance}
          className="mx-1 px-3 py-1.5 rounded-md border border-amber-500 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-amber-50 transition-colors"
        >
          Ver asistencia
        </button>
      </td>
    </>
  );
}