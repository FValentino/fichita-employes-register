import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/actions/employeeActions";
import { getEmployeeMonthlyTurns } from "@/actions/attendanceActions";
import { waitForDb } from "@/backend/datasource";

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

function formatPago(minutes: number, hourlyRate: number): string {
  return `$${((minutes / 60) * hourlyRate).toFixed(2)} ARS`;
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
await waitForDb();
    
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const empResult = await getEmployee(id);
    if (!empResult.success || !empResult.data) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    const turnsResult = await getEmployeeMonthlyTurns(id, month, year);
    if (!turnsResult.success) {
      console.error("Error getting turns:", turnsResult.error);
      return NextResponse.json({ error: "No se pudieron obtener los turnos: " + turnsResult.error }, { status: 500 });
    }

    const employee = empResult.data;
    const turns = turnsResult.data?.turns ?? [];

    let totalMinutes = 0;
    turns.forEach((turn: any) => {
      if (turn.entryTime && turn.exitTime) {
        const entry = new Date(turn.entryTime).getTime();
        const exit = new Date(turn.exitTime).getTime();
        totalMinutes += (exit - entry) / (1000 * 60);
      }
    });

    const totalSalary = (totalMinutes / 60) * employee.hourlyRate;
    const workDays = getUniqueWorkDays(turns);
    const avgPerDay = workDays > 0 ? totalMinutes / workDays : 0;

    const { first: firstDay, last: lastDay } = getDaysInMonth(month, year);

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`HISTÓRICO DE TURNOS - ${employee.lastName} ${employee.name}`, 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período: ${formatFullDate(firstDay)} - ${formatFullDate(lastDay)}`, 105, 28, { align: "center" });
    doc.text(`Emitido: ${formatFullDate(new Date())}`, 105, 35, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Tarifa por Hora: $${employee.hourlyRate.toFixed(2)} ARS`, 20, 48);
    doc.text(`Días Trabajados: ${workDays}`, 20, 55);
    doc.text(`Total Horas: ${formatMinutes(totalMinutes)}`, 20, 62);
    doc.text(`Sueldo Total: $${totalSalary.toFixed(2)} ARS`, 20, 69);

    const headerY = 84;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(255, 184, 0);
    doc.rect(15, headerY - 5, 180, 10, "F");
    doc.setTextColor(26, 22, 18);
    
    doc.text("Fecha", 20, headerY);
    doc.text("Entrada", 65, headerY);
    doc.text("Salida", 105, headerY);
    doc.text("Duración", 145, headerY);
    doc.text("Pago", 175, headerY);

    doc.setFont("helvetica", "normal");
    let y = headerY + 12;

    if (turns.length === 0) {
      doc.setTextColor(128, 128, 128);
      doc.text("No hay registros en este período", 105, y, { align: "center" });
      y += 20;
    } else {
      turns.forEach((turn: any) => {
        let minutes = 0;
        if (turn.entryTime && turn.exitTime) {
          const entry = new Date(turn.entryTime).getTime();
          const exit = new Date(turn.exitTime).getTime();
          minutes = (exit - entry) / (1000 * 60);
        }
        const date = turn.entryTime ? new Date(turn.entryTime) : new Date();

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(formatFullDate(date), 20, y);
        doc.text(formatTime(turn.entryTime), 65, y);
        doc.text(formatTime(turn.exitTime), 105, y);
        doc.text(turn.isOpen ? "Abierto" : formatMinutes(minutes), 145, y);
        doc.text(turn.isOpen || (!turn.entryTime && !turn.exitTime) ? "-" : formatPago(minutes, employee.hourlyRate), 175, y);
        
        y += 10;

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
    doc.rect(15, y - 5, 180, 40, "F");
    doc.setTextColor(0, 0, 0);
    
    doc.text("TOTALES", 20, y + 2);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Días trabajados: ${workDays}`, 20, y + 12);
    doc.text(`Total horas: ${formatMinutes(totalMinutes)}`, 20, y + 20);
    doc.text(`Total sueldos: $${totalSalary.toFixed(2)} ARS`, 20, y + 28);
    doc.text(`Promedio por empleado: ${formatMinutes(avgPerDay)}`, 20, y + 36);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);
    doc.text(`FichitaBit - Histórico de Turnos`, 105, 290, { align: "center" });

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="historico_${employee.lastName}_${employee.name}.pdf"`,
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
