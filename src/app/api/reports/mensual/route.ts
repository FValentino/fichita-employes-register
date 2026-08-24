import { NextResponse } from "next/server";
import { getEmployeesWithMonthlyTurns } from "@/actions/employeeActions";
import { waitForDb } from "@/backend/datasource";
import { withRateLimit, RATE_LIMITS } from "@/lib/api-middleware";

export const dynamic = "force-dynamic";

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

function getUniqueWorkDays(turns: any[]): number {
  const days = new Set<string>();
  turns.forEach((turn: any) => {
    if (turn.entryTime) {
      const date = new Date(turn.entryTime);
      days.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    }
  });
  return days.size;
}

function formatMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatFullDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function GET(request: Request) {
  const rateLimit = withRateLimit(request, RATE_LIMITS.general, "reports:mensual");
  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  try {
    await waitForDb();
    
    const result = await getEmployeesWithMonthlyTurns();
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Error al obtener los datos" }, { status: 500 });
    }

    const { employees, monthStart, monthEnd } = result.data;

    const employeesWithAttendance = employees.filter((e: any) => e.totalHours > 0);
    const employeesWithoutAttendance = employees.filter((e: any) => e.totalHours === 0);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`REPORTE MENSUAL ${formatMonthYear(monthStart).toUpperCase()}`, 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período: ${formatFullDate(monthStart)} - ${formatFullDate(monthEnd)}`, 105, 28, { align: "center" });
    doc.text(`Emitido: ${formatFullDate(new Date())}`, 105, 35, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Empleados activos: ${employees.length}`, 20, 48);
    doc.text(`Empleados con asistencia: ${employeesWithAttendance.length}`, 20, 55);

    const headerY = 68;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(255, 184, 0);
    doc.rect(15, headerY - 5, 180, 10, "F");
    doc.setTextColor(26, 22, 18);
    
    doc.text("Empleado", 17, headerY);
    doc.text("Días", 80, headerY, { align: "center" });
    doc.text("Horas trabajadas", 130, headerY, { align: "center" });
    doc.text("Sueldo", 175, headerY, { align: "center" });

    let y = headerY + 12;
    let totalMinutesAll = 0;
    let totalWorkDaysAll = 0;

    employeesWithAttendance.forEach((emp: any) => {
      const workDays = getUniqueWorkDays(emp.turns);
      totalWorkDaysAll += workDays;
      const hoursDecimal = emp.totalHours;
      const minutes = hoursDecimal * 60;
      totalMinutesAll += minutes;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`${emp.lastName} ${emp.name}`, 17, y);
      doc.text(`${workDays}`, 80, y, { align: "center" });
      doc.text(formatMinutes(minutes), 130, y, { align: "center" });
      doc.text(`$${emp.weeklySalary.toFixed(2)} ARS`, 175, y, { align: "center" });
      
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    if (employeesWithoutAttendance.length > 0) {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Empleados sin asistencia:", 17, y);
      y += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      employeesWithoutAttendance.forEach((emp: any) => {
        doc.text(`• ${emp.lastName} ${emp.name}`, 20, y);
        y += 7;
      });
    }

    y += 10;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y - 5, 180, 30, "F");
    doc.setTextColor(0, 0, 0);
    
    doc.text("TOTALES", 17, y + 2);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total días trabajados: ${totalWorkDaysAll}`, 17, y + 12);
    doc.text(`Total horas trabajadas: ${formatMinutes(totalMinutesAll)}`, 17, y + 20);

    const totalSalary = employees.reduce((sum: number, e: any) => sum + e.weeklySalary, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Sueldo total a pagar:", 100, y + 15);
    doc.text(`$${totalSalary.toFixed(2)} ARS`, 175, y + 15, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`Generado el ${formatFullDate(new Date())} - FichitaBit`, 105, 290, { align: "center" });

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte_mensual.pdf"`,
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
