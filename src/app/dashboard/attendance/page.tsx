export const dynamic = "force-dynamic";

import { RegisterAttendanceButton } from "@/components/attendance";
import { getAttendanceStatus } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

export default async function AttendancePage() {
  const result = await getAttendanceStatus();

  if (!result.success) {
    return (
      <div className="p-4">
        <PageTitle>Registrar Asistencia</PageTitle>
        <p className="text-red-500">Error al cargar: {result.error}</p>
      </div>
    );
  }

  const status = result.data ?? [];

  console.log(status);

  return (
    <div className="p-4">
      <PageTitle>Registrar Asistencia</PageTitle>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {status.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-base m-0">No hay empleados activos</p>
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
                    <th className="p-4 text-center text-gray-500 text-sm font-medium">Estado</th>
                    <th className="p-4 text-center text-gray-500 text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {status.map((item: any, index: number) => (
                    <tr key={item.employeeId} className={index > 0 ? "border-t border-gray-200" : ""}>
                      <td className="p-4 text-center text-gray-700 text-sm">{item.lastName}</td>
                      <td className="p-4 text-center text-gray-700 text-sm">{item.name}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.isWorking
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.isWorking ? "Trabajando" : "No trabajando"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <RegisterAttendanceButton employeeId={item.employeeId} isWorking={item.isWorking} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {status.map((item: any) => (
                <div key={item.employeeId} className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{item.lastName}, {item.name}</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                          item.isWorking
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.isWorking ? "Trabajando" : "No trabajando"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <RegisterAttendanceButton employeeId={item.employeeId} isWorking={item.isWorking} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}