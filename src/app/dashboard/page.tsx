import { theme } from "@/lib/theme";
import { getDashboardStats } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.white,
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ color: theme.colors.gray[500], fontSize: "14px", margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: "32px", fontWeight: "bold", color, margin: "8px 0 0 0" }}>
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const result = await getDashboardStats();

  const defaultStats = {
    totalEmployees: 0,
    workingEmployees: 0,
    entriesToday: 0,
    exitsToday: 0,
    tardanzasSemanales: 0,
  };

  const stats = result.success ? result.data ?? defaultStats : defaultStats;

  return (
    <div>
      <PageTitle>Dashboard - Seguimiento de Asistencia</PageTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          <StatCard
            title="Empleados Registrados"
            value={stats.totalEmployees}
            color={theme.colors.neutral}
          />
          <StatCard
            title="Empleados Trabajando"
            value={stats.workingEmployees}
            color={theme.colors.neutral}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          <StatCard
            title="Entradas Hoy"
            value={stats.entriesToday}
            color={theme.colors.primary}
          />
          <StatCard
            title="Salidas Hoy"
            value={stats.exitsToday}
            color={theme.colors.secondary}
          />
        </div>

        <div style={{ maxWidth: "50%" }}>
          <StatCard
            title="Tardanzas Semanales"
            value={0}
            color={theme.colors.tertiary}
          />
        </div>
      </div>
    </div>
  );
}
