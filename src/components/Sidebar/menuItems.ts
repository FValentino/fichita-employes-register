export interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

export const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Registrar Asistencia", href: "/dashboard/attendance", icon: "⏱️" },
  { label: "Empleados", href: "/dashboard/employees", icon: "👥" },
  { label: "Reportes", href: "/dashboard/reports", icon: "📋" },
];
