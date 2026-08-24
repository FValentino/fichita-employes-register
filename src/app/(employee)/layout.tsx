import { EmployeeNav } from "@/components/employee-nav";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <EmployeeNav />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 flex justify-center">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
