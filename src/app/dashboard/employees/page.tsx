import { theme } from "@/lib/theme";
import { AddEmployeeButton, EmployeeActions } from "@/components/employees";
import { getEmployees } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

export default async function EmployeesPage() {
  const result = await getEmployees();

  if (!result.success) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <PageTitle>Empleados</PageTitle>
          <AddEmployeeButton />
        </div>
        <p style={{ color: "#EF4444" }}>Error al cargar empleados: {result.error}</p>
      </div>
    );
  }

  const employees = result.data ?? [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <PageTitle>Empleados</PageTitle>
        <AddEmployeeButton />
      </div>

      <div
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {employees.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: theme.colors.gray[500], fontSize: "16px", margin: 0 }}>
              No hay empleados
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.gray[100] }}>
                <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                  Apellido
                </th>
                <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                  Nombre
                </th>
                <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                  Horas Semanales
                </th>
                <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee: { id: string; name: string; lastName: string; hourlyRate: number; weeklyHours: number }, index: number) => (
                <tr
                  key={employee.id}
                  style={{
                    borderTop: index > 0 ? `1px solid ${theme.colors.gray[200]}` : "none",
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
                  <EmployeeActions employee={employee} />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
