import { z } from "zod";

// ── Employee ────────────────────────────────────────────────────────
export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Nombre es requerido").max(100),
  lastName: z.string().trim().min(1, "Apellido es requerido").max(100),
  hourlyRate: z.number().min(0).max(100000).optional(),
  weeklyHours: z.number().min(0).max(60).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  role: z.enum(["admin", "employee"]).optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  hourlyRate: z.number().min(0).max(100000).optional(),
  weeklyHours: z.number().min(0).max(60).optional(),
  active: z.boolean().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  authUserId: z.string().uuid().optional(),
  role: z.enum(["admin", "employee"]).optional(),
});

// ── Location ────────────────────────────────────────────────────────
export const createLocationSchema = z.object({
  name: z.string().trim().min(1, "Nombre es requerido").max(200),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  radiusMeters: z.number().min(1).max(50000).optional(),
  address: z.string().max(500).optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  radiusMeters: z.number().min(1).max(50000).optional(),
  address: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

// ── Turns ───────────────────────────────────────────────────────────
const turnEntrySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  entryTime: z.string().nullable(),
  exitTime: z.string().nullable(),
});

export const bulkCreateTurnsSchema = z.object({
  employeeId: z.string().uuid(),
  turns: z.array(turnEntrySchema).min(1).max(7),
});

// ── Settings ────────────────────────────────────────────────────────
export const setSettingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().max(1000),
});

// ── Invite ──────────────────────────────────────────────────────────
export const inviteEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(128),
});

// ── Types ───────────────────────────────────────────────────────────
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type BulkCreateTurnsInput = z.infer<typeof bulkCreateTurnsSchema>;
export type SetSettingInput = z.infer<typeof setSettingSchema>;
export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>;
