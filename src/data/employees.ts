export interface Employee {
  id: number;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  tardanzas: number;
}

export const employeesData: Employee[] = [
  {
    id: 1,
    name: "Juan",
    lastName: "Pérez",
    hourlyRate: 100,
    weeklyHours: 40,
    tardanzas: 2,
  },
  {
    id: 2,
    name: "María",
    lastName: "González",
    hourlyRate: 100,
    weeklyHours: 35,
    tardanzas: 0,
  },
  {
    id: 3,
    name: "Carlos",
    lastName: "Rodríguez",
    hourlyRate: 100,
    weeklyHours: 40,
    tardanzas: 5,
  },
  {
    id: 4,
    name: "Ana",
    lastName: "Martínez",
    hourlyRate: 100,
    weeklyHours: 30,
    tardanzas: 1,
  },
  {
    id: 5,
    name: "Pedro",
    lastName: "Sánchez",
    hourlyRate: 100,
    weeklyHours: 40,
    tardanzas: 3,
  },
];
