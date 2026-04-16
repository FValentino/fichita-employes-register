import { theme } from "@/lib/theme";
import { RegisterAttendanceButton } from "@/components/attendance";
import { getAttendanceStatus } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

export default async function AttendancePage() {
  const result = await getAttendanceStatus();

  if (!result.success) {
    return (
      <div>
        <PageTitle>Registrar Asistencia</PageTitle>
        <p style={{ color: "#EF4444" }}>Error al cargar: {result.error}</p>
      </div>
    );
  }

  const status = result.data ?? [];

  return (
    <div>
      <PageTitle>Registrar Asistencia</PageTitle>

      <div
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {status.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <p style={{ color: theme.colors.gray[500], fontSize: "16px", margin: 0 }}>
              No hay empleados activos
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
                  Estado
                </th>
                <th style={{ padding: "16px", textAlign: "center", color: theme.colors.gray[500], fontSize: "14px", fontWeight: "500" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {status.map((item: any, index: number) => (
                <tr
                  key={item.employeeId}
                  style={{
                    borderTop: index > 0 ? `1px solid ${theme.colors.gray[200]}` : "none",
                  }}
                >
                  <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
                    {item.lastName}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center", color: theme.colors.neutral, fontSize: "14px" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: "500",
                        backgroundColor: item.isWorking ? "#DCFCE7" : "#FEF3C7",
                        color: item.isWorking ? "#166534" : "#92400E",
                      }}
                    >
                      {item.isWorking ? "Trabajando" : "No trabajando"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <RegisterAttendanceButton employeeId={item.employeeId} isWorking={item.isWorking} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
