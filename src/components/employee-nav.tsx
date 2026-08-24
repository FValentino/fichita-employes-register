"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiOutlineHome,
  HiCamera,
  HiOutlineCamera,
  HiClock,
  HiOutlineClock,
  HiDocumentText,
  HiOutlineDocumentText,
  HiUser,
  HiOutlineUser,
} from "react-icons/hi2";

const tabs = [
  { href: "/home", label: "Inicio", icon: HiOutlineHome, activeIcon: HiHome },
  { href: "/scanner", label: "Escanear", icon: HiOutlineCamera, activeIcon: HiCamera },
  { href: "/hours", label: "Horas", icon: HiOutlineClock, activeIcon: HiClock },
  { href: "/justifications", label: "Justificaciones", icon: HiOutlineDocumentText, activeIcon: HiDocumentText },
  { href: "/profile", label: "Perfil", icon: HiOutlineUser, activeIcon: HiUser },
];

export function EmployeeNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = isActive ? tab.activeIcon : tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-decoration-none transition-colors ${
                  isActive ? "text-amber-500" : "text-gray-400"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-neutral-800">
        <div className="p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-sm text-neutral-900">
              FB
            </div>
            <h1 className="text-lg font-bold text-white m-0">FichitaBit</h1>
          </div>
          <p className="text-gray-400 text-xs mt-2 m-0">Vista del empleado</p>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = isActive ? tab.activeIcon : tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-decoration-none transition-all duration-200 ${
                  isActive
                    ? "bg-amber-500 text-neutral-900 font-semibold"
                    : "text-white hover:bg-gray-700 font-normal"
                }`}
              >
                <Icon className="text-lg" />
                <span className="text-sm">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
