import { theme } from "@/lib/theme";

export default function DashboardPage() {
  return (
    <div>
      <h2 style={{ color: theme.colors.neutral, marginBottom: "24px" }}>
        Dashboard - Seguimiento de Asistencia
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.white,
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: theme.colors.gray[500], fontSize: "14px", margin: 0 }}>
              Empleados Activos
            </h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: theme.colors.neutral, margin: "8px 0 0 0" }}>
              0
            </p>
          </div>

          <div
            style={{
              backgroundColor: theme.colors.white,
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: theme.colors.gray[500], fontSize: "14px", margin: 0 }}>
              Entradas Hoy
            </h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: theme.colors.primary, margin: "8px 0 0 0" }}>
              0
            </p>
          </div>

          <div
            style={{
              backgroundColor: theme.colors.white,
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ color: theme.colors.gray[500], fontSize: "14px", margin: 0 }}>
              Salidas Hoy
            </h3>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: theme.colors.secondary, margin: "8px 0 0 0" }}>
              0
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.white,
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            maxWidth: "calc(33.33% - 11px)",
          }}
        >
          <h3 style={{ color: theme.colors.gray[500], fontSize: "14px", margin: 0 }}>
            Tardanzas Semanales
          </h3>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: theme.colors.tertiary, margin: "8px 0 0 0" }}>
            0
          </p>
        </div>
      </div>
    </div>
  );
}
