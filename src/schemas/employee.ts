import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  hourlyRate: z.number().min(0, "El precio por hora debe ser mayor o igual a 0"),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
