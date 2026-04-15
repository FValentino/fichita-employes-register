import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/actions/employeeActions";
import { getEmployeeWeeklyTurns } from "@/actions/attendanceActions";
import { waitForDb } from "@/backend/datasource";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await waitForDb();
    
    const { id } = await params;
    const employeeId = parseInt(id);

    const empResult = await getEmployee(employeeId);
    if (!empResult.success || !empResult.data) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    const turnsResult = await getEmployeeWeeklyTurns(employeeId);
    if (!turnsResult.success || !turnsResult.data) {
      return NextResponse.json({ error: "No se pudieron obtener los turnos" }, { status: 500 });
    }

    const employee = empResult.data;
    const turns = turnsResult.data.turns;

    let totalHours = 0;
    turns.forEach((turn: any) => {
      if (turn.entryTime && turn.exitTime) {
        const entry = new Date(turn.entryTime).getTime();
        const exit = new Date(turn.exitTime).getTime();
        totalHours += (exit - entry) / (1000 * 60 * 60);
      }
    });

    const weeklySalary = totalHours * employee.hourlyRate;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const formatFullDate = (date: Date | string) => {
      const d = new Date(date);
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const formatDate = (date: Date | string | null) => {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    };

    const getWeekDay = (date: Date | string) => {
      const d = new Date(date);
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return days[d.getDay()];
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`Histórico de Turnos - ${employee.lastName} ${employee.name}`, 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${formatFullDate(turnsResult.data.monday)} - ${formatFullDate(turnsResult.data.sunday)}`, 105, 30, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("INFORMACIÓN DEL EMPLEADO", 20, 45);
    doc.line(20, 47, 100, 47);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Tarifa por Hora: $${employee.hourlyRate.toFixed(2)}`, 20, 55);
    doc.text(`Total Horas: ${totalHours.toFixed(2)}`, 20, 62);
    doc.text(`Sueldo Semanal: $${weeklySalary.toFixed(2)}`, 20, 69);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DETALLE DE TURNOS", 20, 85);
    doc.line(20, 87, 80, 87);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Día", 20, 95);
    doc.text("Entrada", 60, 95);
    doc.text("Salida", 100, 95);
    doc.text("Horas", 140, 95);
    doc.line(20, 97, 170, 97);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let y = 105;

    turns.forEach((turn: any) => {
      let hours = 0;
      if (turn.entryTime && turn.exitTime) {
        const entry = new Date(turn.entryTime).getTime();
        const exit = new Date(turn.exitTime).getTime();
        hours = (exit - entry) / (1000 * 60 * 60);
      }
      const date = turn.entryTime ? new Date(turn.entryTime) : new Date();

      doc.text(`${getWeekDay(date)} ${date.getDate()}/${date.getMonth() + 1}`, 20, y);
      doc.text(formatDate(turn.entryTime), 60, y);
      doc.text(formatDate(turn.exitTime), 100, y);
      doc.text(turn.isOpen ? "Abierto" : `${hours.toFixed(2)}h`, 140, y);
      y += 7;

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RESUMEN", 20, y + 10);
    doc.line(20, y + 12, 50, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Horas Semanales: ${totalHours.toFixed(2)} horas`, 20, y + 20);
    doc.text(`Tarifa por Hora: $${employee.hourlyRate.toFixed(2)}`, 20, y + 27);
    doc.text(`Sueldo de la Semana: $${weeklySalary.toFixed(2)}`, 20, y + 34);

    doc.setFontSize(8);
    doc.text(`Generado el ${formatFullDate(new Date())} - FichitaBit`, 105, 290, { align: "center" });

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
