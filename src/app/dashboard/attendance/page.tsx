import { theme } from "@/lib/theme";

export default function AttendancePage() {
  return (
    <div>
      <h2 style={{ color: theme.colors.neutral, marginBottom: "24px" }}>
        Registrar Asistencia
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
          Pendiente: formulario para entrada/salida, validaciones y registro.
        </p>
      </div>
    </div>
  );
}

