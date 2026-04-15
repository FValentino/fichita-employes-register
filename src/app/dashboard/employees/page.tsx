import { theme } from "@/lib/theme";
import { AddEmployeeButton } from "@/components/employees";

async function getEmployees() {
  return [
    { id: 1, name: "Juan", lastName: "Pérez", weeklyHours: 40 },
    { id: 2, name: "María", lastName: "González", weeklyHours: 35 },
    { id: 3, name: "Carlos", lastName: "Rodríguez", weeklyHours: 40 },
    { id: 4, name: "Ana", lastName: "Martínez", weeklyHours: 30 },
    { id: 5, name: "Pedro", lastName: "Sánchez", weeklyHours: 40 },
  ];
}

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ color: theme.colors.neutral, margin: 0 }}>Empleados</h2>
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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: theme.colors.gray[100] }}>
              <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                Nombre
              </th>
              <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                Apellido
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
            {employees.map((employee, index) => (
              <tr
                key={employee.id}
                style={{
                  borderTop: index > 0 ? `1px solid ${theme.colors.gray[200]}` : "none",
                }}
              >
                <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
                  {employee.name}
                </td>
                <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
                  {employee.lastName}
                </td>
                <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
                  {employee.weeklyHours} hs
                </td>
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <span style={{ color: "#3B82F6", fontSize: "13px", cursor: "pointer", marginRight: "16px" }}>
                    Editar
                  </span>
                  <span style={{ color: "#3B82F6", fontSize: "13px", cursor: "pointer", marginRight: "16px" }}>
                    Eliminar
                  </span>
                  <span style={{ color: "#3B82F6", fontSize: "13px", cursor: "pointer" }}>
                    Ver asistencia
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
