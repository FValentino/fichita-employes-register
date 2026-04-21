import { getDashboardStats } from "@/actions";
import { PageTitle } from "@/components/PageTitle";

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
      <h3 className="text-gray-500 text-sm md:text-base m-0">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold m-2 mt-0" style={{ color }}>{value}</p>
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
    <div className="p-4">
      <PageTitle>
        Seguimiento de Asistencia
      </PageTitle>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Empleados Registrados" value={stats.totalEmployees} color="#374151" />
          <StatCard title="Empleados Trabajando" value={stats.workingEmployees} color="#374151" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Entradas Hoy" value={stats.entriesToday} color="#f59e0b" />
          <StatCard title="Salidas Hoy" value={stats.exitsToday} color="#10b981" />
        </div>

        <div className="sm:max-w-[50%]">
          <StatCard title="Tardanzas Semanales" value={0} color="#8b5cf6" />
        </div>
      </div>
    </div>
  );
}