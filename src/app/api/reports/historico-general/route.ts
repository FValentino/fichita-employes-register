import { NextRequest, NextResponse } from "next/server";
import { getEmployeesWithMonthlyTurnsForPeriod } from "@/actions/employeeActions";
import { waitForDb } from "@/backend/datasource";

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

function formatMonthYear(month: number, year: number): string {
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${months[month - 1]} ${year}`;
}

function formatMonthYearUpper(month: number, year: number): string {
  const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
                  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  return `${months[month - 1]} ${year}`;
}

function formatFullDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function getDaysInMonth(month: number, year: number): { first: Date; last: Date } {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  last.setHours(23, 59, 59, 999);
  return { first, last };
}

export async function GET(request: NextRequest) {
  try {
    await waitForDb();
    
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const result = await getEmployeesWithMonthlyTurnsForPeriod(month, year);
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Error al obtener los datos" }, { status: 500 });
    }

    const { employees, monthStart, monthEnd } = result.data;

    const employeesWithAttendance = employees.filter((e: any) => e.totalHours > 0);
    const employeesWithoutAttendance = employees.filter((e: any) => e.totalHours === 0);

    let totalAllMinutes = 0;
    employeesWithAttendance.forEach((e: any) => {
      totalAllMinutes += e.totalHours * 60;
    });
    const totalAllSalary = employeesWithAttendance.reduce((sum: number, e: any) => sum + e.weeklySalary, 0);
    const totalWorkDays = employeesWithAttendance.reduce((sum: number, e: any) => sum + e.workDays, 0);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`HISTÓRICO GENERAL ${formatMonthYearUpper(month, year)}`, 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período: ${formatFullDate(monthStart)} - ${formatFullDate(monthEnd)}`, 105, 28, { align: "center" });
    doc.text(`Emitido: ${formatFullDate(new Date())}`, 105, 35, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total empleados: ${employees.length}`, 20, 48);
    doc.text(`Con asistencia: ${employeesWithAttendance.length}`, 20, 55);
    doc.text(`Sin asistencia: ${employeesWithoutAttendance.length}`, 20, 62);

    const headerY = 76;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(255, 184, 0);
    doc.rect(15, headerY - 5, 180, 10, "F");
    doc.setTextColor(26, 22, 18);
    
    doc.text("Empleado", 20, headerY);
    doc.text("Días", 100, headerY);
    doc.text("Horas", 125, headerY);
    doc.text("Sueldo", 155, headerY);

    doc.setFont("helvetica", "normal");
    let y = headerY + 12;

    if (employeesWithAttendance.length === 0) {
      doc.setTextColor(128, 128, 128);
      doc.text("No hay registros de asistencia en este período", 105, y, { align: "center" });
      y += 20;
    } else {
      employeesWithAttendance.forEach((emp: any) => {
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`${emp.lastName} ${emp.name}`, 20, y);
        doc.text(String(emp.workDays), 100, y);
        doc.text(formatMinutes(emp.totalHours * 60), 125, y);
        doc.text(`$${emp.weeklySalary.toFixed(2)} ARS`, 155, y);
        
        y += 10;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    if (employeesWithoutAttendance.length > 0) {
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("EMPLEADOS SIN ASISTENCIA", 20, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      employeesWithoutAttendance.forEach((emp: any) => {
        doc.setTextColor(128, 128, 128);
        doc.text(`${emp.lastName} ${emp.name}`, 20, y);
        y += 8;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
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
    doc.rect(15, y - 5, 180, 35, "F");
    doc.setTextColor(0, 0, 0);
    
    doc.text("TOTALES", 20, y + 2);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Días totales trabajados: ${totalWorkDays}`, 20, y + 12);
    doc.text(`Total horas: ${formatMinutes(totalAllMinutes)}`, 20, y + 20);
    doc.text(`Total sueldos: $${totalAllSalary.toFixed(2)} ARS`, 20, y + 28);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`FichitaBit - Histórico General`, 105, 290, { align: "center" });

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="historico_general_${formatMonthYear(month, year).replace(/ /g, "_")}.pdf"`,
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
