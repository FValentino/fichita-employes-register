/**
 * Shared turn calculation logic used by weekly, monthly, and period reports.
 * Eliminates the 95% code duplication across 3 functions.
 */

import { Employee } from "@/backend/models/Employee";
import { Attendance } from "@/backend/models/Attendance";

export interface TurnRecord {
  id: number;
  entryTime: Date | null;
  exitTime: Date | null;
  isOpen: boolean;
}

export interface EmployeeTurnResult {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  turns: TurnRecord[];
  totalHours: number;
  weeklySalary: number;
  workDays: number;
}

function toPlainAttendance(attendance: any) {
  return {
    id: attendance.id,
    employeeId: attendance.employeeId,
    type: attendance.type,
    timestamp: attendance.timestamp,
    createdAt: attendance.created_at,
  };
}

/**
 * Given a list of employees and a single batch of attendances,
 * compute turn records, total hours, and salary for each employee.
 */
export function computeTurnsForEmployees(
  employees: Employee[],
  allAttendances: Attendance[]
): EmployeeTurnResult[] {
  // Index attendances by employeeId for O(1) lookup
  const byEmployee = new Map<string, typeof allAttendances>();
  for (const att of allAttendances) {
    const plain = toPlainAttendance(att);
    const list = byEmployee.get(plain.employeeId) ?? [];
    list.push(att);
    byEmployee.set(plain.employeeId, list);
  }

  return employees.map((emp) => {
    const attendances = (byEmployee.get(emp.id) ?? []).map(toPlainAttendance);

    const entries = attendances.filter((a: any) => a.type === "ENTRADA");
    const exits = attendances.filter((a: any) => a.type === "SALIDA");

    const turns: TurnRecord[] = [];
    entries.forEach((entry: any, index: number) => {
      const exit = exits.find(
        (e: any) => new Date(e.timestamp) > new Date(entry.timestamp)
      );
      turns.push({
        id: index,
        entryTime: entry.timestamp,
        exitTime: exit ? exit.timestamp : null,
        isOpen: !exit,
      });
    });

    let totalMinutes = 0;
    for (const turn of turns) {
      if (turn.entryTime && turn.exitTime) {
        const entryMs = new Date(turn.entryTime).getTime();
        const exitMs = new Date(turn.exitTime).getTime();
        totalMinutes += (exitMs - entryMs) / (1000 * 60);
      }
    }

    const totalHours = totalMinutes / 60;
    const weeklySalary = totalHours * Number(emp.hourlyRate);

    const uniqueDays = new Set<string>();
    for (const turn of turns) {
      if (turn.entryTime) {
        const d = new Date(turn.entryTime);
        uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    }

    return {
      id: emp.id,
      name: emp.name,
      lastName: emp.lastName,
      hourlyRate: Number(emp.hourlyRate),
      weeklyHours: Number(emp.weeklyHours),
      turns,
      totalHours,
      weeklySalary,
      workDays: uniqueDays.size,
    };
  });
}
