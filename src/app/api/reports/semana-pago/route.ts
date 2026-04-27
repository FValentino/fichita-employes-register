import { NextResponse } from "next/server";
import { waitForDb } from "@/backend/datasource";
import { employeeService } from "@/backend/services/EmployeeService";
import { getPayweekTurns } from "@/actions/attendanceActions";

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

function formatFullDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function GET() {
  try {
    await waitForDb();

    const today = new Date();
    const dayOfWeek = today.getDay();
    
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
    
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const start = new Date(lastMonday);
    start.setHours(10, 0, 0, 0);
    
    const end = new Date(thisMonday);
    end.setHours(7, 0, 0, 0);

    const { jsPDF } = await import("jspdf");
    const employees = await employeeService.getActive();

    const employeeDataResults = await Promise.all(
      employees.map(async (employee) => {
        const result = await getPayweekTurns(employee.id);
        
        if (!result.success || !result.data) {
          return {
            employee,
            turns: [],
            totalHours: 0,
            weeklySalary: 0,
            workDays: 0,
          };
        }

        const turns = result.data.turns;
        let totalHours = 0;
        
        turns.forEach((turn: any) => {
          if (turn.entryTime && turn.exitTime) {
            const entry = new Date(turn.entryTime);
            const exit = new Date(turn.exitTime);
            const hours = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
          }
        });

        const hourlyRate = Number(employee.hourlyRate) || 0;
        const weeklySalary = totalHours * hourlyRate;

        const days = new Set<string>();
        turns.forEach((turn: any) => {
          if (turn.entryTime) {
            const date = new Date(turn.entryTime);
            days.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
          }
        });

        return {
          employee,
          turns,
          totalHours,
          weeklySalary,
          workDays: days.size,
        };
      })
    );

    const employeesWithAttendance = employeeDataResults.filter((e) => e.totalHours > 0);
    const employeesWithoutAttendance = employeeDataResults.filter((e) => e.totalHours === 0);

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REPORTE SEMANA DE PAGO", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Período: ${formatFullDate(start)} 10:00 - ${formatFullDate(end)} 07:00`, 105, 28, { align: "center" });
    doc.text(`Emitido: ${formatFullDate(new Date())}`, 105, 35, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Empleados activos: ${employees.length}`, 20, 42);
    doc.text(`Empleados con asistencia: ${employeesWithAttendance.length}`, 20, 49);

    const headerY = 62;
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
      const workDays = emp.workDays;
      totalWorkDaysAll += workDays;
      const hoursDecimal = emp.totalHours;
      const minutes = hoursDecimal * 60;
      totalMinutesAll += minutes;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`${emp.employee.lastName} ${emp.employee.name}`, 17, y);
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
        doc.text(`• ${emp.employee.lastName} ${emp.employee.name}`, 20, y);
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

    const totalSalary = employeeDataResults.reduce((sum: number, e: any) => sum + e.weeklySalary, 0);
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
        "Content-Disposition": `attachment; filename="reporte_semana_pago_${formatFullDate(start).replace(/\//g, "-")}.pdf"`,
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