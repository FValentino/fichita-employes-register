import { theme } from "@/lib/theme";

export default function ReportsPage() {
  return (
    <div>
      <h2 style={{ color: theme.colors.neutral, marginBottom: "24px" }}>
        Reportes
      </h2>

      <div
        style={{
          backgroundColor: theme.colors.white,
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, color: theme.colors.gray[500] }}>
          Pendiente: filtros por fecha/empleado y exportación.
        </p>
      </div>
    </div>
  );
}

