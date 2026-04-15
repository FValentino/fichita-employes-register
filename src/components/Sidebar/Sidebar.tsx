"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { theme } from "@/lib/theme";
import { menuItems, MenuItem } from "./menuItems";

function MenuLink({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "8px",
        textDecoration: "none",
        color: isActive ? theme.colors.neutral : theme.colors.white,
        backgroundColor: isActive ? theme.colors.primary : "transparent",
        fontWeight: isActive ? "600" : "400",
        transition: "all 0.2s ease",
      }}
    >
      <span style={{ fontSize: "18px" }}>{item.icon}</span>
      <span style={{ fontSize: "14px" }}>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside
      style={{
        width: "260px",
        minHeight: "100vh",
        backgroundColor: theme.colors.neutral,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "24px",
          borderBottom: `1px solid ${theme.colors.gray[400]}`,
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: theme.colors.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "18px",
            color: theme.colors.neutral,
          }}
        >
          FB
        </div>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            margin: 0,
            color: theme.colors.white,
          }}
        >
          FichitaBit
        </h1>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {menuItems.map((item) => (
          <MenuLink key={item.href} item={item} />
        ))}
      </nav>

      <div
        style={{
          padding: "16px 24px",
          borderTop: `1px solid ${theme.colors.gray[400]}`,
        }}
      >
        <p
          style={{
            color: theme.colors.gray[400],
            fontSize: "12px",
            margin: 0,
            textAlign: "center",
          }}
        >
          v1.0
        </p>
      </div>
    </aside>
  );
}
