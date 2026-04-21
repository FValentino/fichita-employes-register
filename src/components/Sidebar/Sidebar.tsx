"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems, MenuItem } from "./menuItems";

function MenuLink({ item, onClick }: { item: MenuItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-decoration-none transition-all duration-200 ${
        isActive
          ? "bg-amber-500 text-neutral-900 font-semibold"
          : "text-white hover:bg-gray-700 font-normal"
      }`}
    >
      <span className="text-lg">{item.icon}</span>
      <span className="text-sm">{item.label}</span>
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón menú móvil */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-amber-500 text-neutral-900 shadow-lg"
      >
        <MenuIcon />
      </button>

      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 min-h-screen bg-neutral-800 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center font-bold text-lg text-neutral-900">
              FB
            </div>
            <h1 className="text-xl font-bold text-white m-0">
              FichitaBit
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-white p-1"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 p-4 md:p-6 flex flex-col gap-2">
          {menuItems.map((item) => (
            <MenuLink key={item.href} item={item} onClick={() => setIsOpen(false)} />
          ))}
        </nav>

        <div className="p-4 md:p-6 border-t border-gray-600">
          <p className="text-gray-400 text-xs text-center m-0">
            v1.0
          </p>
        </div>
      </aside>
    </>
  );
}