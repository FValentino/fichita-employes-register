import { NextResponse } from "next/server";
import { getEmployeesWithWeeklyTurns } from "@/actions/employeeActions";
import { waitForDb } from "@/backend/datasource";

export async function GET() {
  try {
    await waitForDb();
    
    const result = await getEmployeesWithWeeklyTurns();
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Error al obtener los datos" }, { status: 500 });
    }

    const { employees, weekStart, weekEnd } = result.data;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const formatFullDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const totalHours = employees.reduce((sum: number, e: any) => sum + e.totalHours, 0);
    const totalSalary = employees.reduce((sum: number, e: any) => sum + e.weeklySalary, 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Reporte Semanal", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${formatFullDate(weekStart)} - ${formatFullDate(weekEnd)}`, 105, 30, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Empleado", 20, 45);
    doc.text("Tarifa/Hora", 80, 45);
    doc.text("Horas", 120, 45);
    doc.text("Sueldo", 150, 45);
    doc.line(20, 47, 180, 47);

    doc.setFont("helvetica", "normal");
    let y = 55;

    employees.forEach((emp: any) => {
      doc.text(`${emp.lastName} ${emp.name}`, 20, y);
      doc.text(`$${emp.hourlyRate.toFixed(2)}`, 80, y);
      doc.text(`${emp.totalHours.toFixed(2)}`, 120, y);
      doc.text(`$${emp.weeklySalary.toFixed(2)}`, 150, y);
      y += 7;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.line(20, y, 180, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 20, y);
    doc.text("", 80, y);
    doc.text(`${totalHours.toFixed(2)}`, 120, y);
    doc.text(`$${totalSalary.toFixed(2)}`, 150, y);

    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Empleados: ${employees.length}`, 20, y);
    doc.text(`Total Horas: ${totalHours.toFixed(2)} horas`, 20, y + 7);
    doc.text(`Total Sueldos: $${totalSalary.toFixed(2)}`, 20, y + 14);

    doc.setFontSize(8);
    doc.text(`Generado el ${formatFullDate(new Date())} - FichitaBit`, 105, 290, { align: "center" });

    const pdfBuffer = doc.output("arraybuffer");

    const today = new Date().toISOString().split("T")[0];

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte_semanal_${today}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ 
      error: "Error al generar el PDF",
      details: error?.message || String(error)
    }, { status: 500 });
  }
}
