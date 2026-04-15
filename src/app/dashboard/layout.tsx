import { Sidebar } from "@/components";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F5F5F5" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "24px" }}>{children}</main>
    </div>
  );
}
