export const dynamic = "force-dynamic";

import { AddEmployeeButton, EmployeeActions } from "@/components/employees";
import { getEmployees } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

export default async function EmployeesPage() {
  const result = await getEmployees();

  if (!result.success) {
    return (
      <div className="w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <PageTitle> Empleados </PageTitle>
          <AddEmployeeButton />
        </div>
        <p className="text-red-500">Error al cargar empleados: {result.error}</p>
      </div>
    );
  }

  const employees = result.data ?? [];

  return (
    <div className="p-4">
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <PageTitle> Empleados </PageTitle>
        <AddEmployeeButton />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-base m-0">No hay empleados</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-4 text-center text-gray-500 text-sm font-medium">Apellido</th>
                    <th className="p-4 text-center text-gray-500 text-sm font-medium">Nombre</th>
                    <th className="p-4 text-center text-gray-500 text-sm font-medium">Horas Semanales</th>
                    <th className="p-4 text-center text-gray-500 text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee: { id: string; name: string; lastName: string; hourlyRate: number; weeklyHours: number }, index: number) => (
                    <tr key={employee.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                      <td className="p-4 text-center text-gray-700 text-sm">{employee.lastName}</td>
                      <td className="p-4 text-center text-gray-700 text-sm">{employee.name}</td>
                      <td className="p-4 text-center text-gray-700 text-sm">{employee.weeklyHours} hs</td>
                      <EmployeeActions employee={employee} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {employees.map((employee: { id: string; name: string; lastName: string; hourlyRate: number; weeklyHours: number }) => (
                <div key={employee.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{employee.lastName}, {employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.weeklyHours} horas semanales</p>
                    </div>
                  </div>
                  <EmployeeActions employee={employee} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}