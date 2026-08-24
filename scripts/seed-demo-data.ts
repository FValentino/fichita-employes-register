/**
 * Demo seeder for Fichita.
 *
 * Creates:
 *   - 3 locations (Casa Central, Sucursal Palermo, Sucursal Caballito)
 *   - 5 employees (1 "admin" + 4 regular), each with a Supabase auth user
 *     (password "Demo1234!" for ALL demo users)
 *   - ~3 weeks of workday attendance (ENTRADA 09:00 / SALIDA 18:00, Argentina
 *     time) for every employee that has no attendance rows yet
 *   - Setting require_scan_photo = "false"
 *
 * Demo credentials:
 *   admin@demo.com / Demo1234!
 *   juan@demo.com / Demo1234!
 *   maria@demo.com / Demo1234!
 *   pedro@demo.com / Demo1234!
 *   lucia@demo.com / Demo1234!
 *
 * Run from the project root:
 *   npx tsx scripts/seed-demo-data.ts
 *
 * Requires in .env.local: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY.
 */
import "reflect-metadata";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { waitForDb, AppDataSource } from "../src/backend/datasource";
import { employeeRepository } from "../src/backend/repositories/EmployeeRepository";
import { locationRepository } from "../src/backend/repositories/LocationRepository";
import { attendanceRepository } from "../src/backend/repositories/AttendanceRepository";
import { settingRepository } from "../src/backend/repositories/SettingRepository";
import { Employee } from "../src/backend/models/Employee";
import { UserRole } from "../src/backend/models/Employee";
import { Attendance, AttendanceType } from "../src/backend/models/Attendance";
import { Location } from "../src/backend/models/Location";

const DEMO_PASSWORD = "Demo1234!";
const ARGENTINA_UTC_OFFSET_HOURS = -3;
const WORK_WEEK_DAYS = 15; // 3 weeks of Monday-Friday workdays
const ENTRY_HOUR = 9;  // ENTRADA at 09:00 Argentina time
const EXIT_HOUR = 18;  // SALIDA at 18:00 Argentina time

interface DemoLocationSeed {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  address: string;
}

interface DemoEmployeeSeed {
  email: string;
  name: string;
  lastName: string;
  hourlyRate: number;
  weeklyHours: number;
  role: UserRole;
}

const DEMO_LOCATIONS: DemoLocationSeed[] = [
  {
    name: "Casa Central",
    lat: -34.6037,
    lng: -58.3816,
    radiusMeters: 100,
    address: "Av. Corrientes 1234, CABA",
  },
  {
    name: "Sucursal Palermo",
    lat: -34.5875,
    lng: -58.4305,
    radiusMeters: 100,
    address: "Av. Santa Fe 3456, CABA",
  },
  {
    name: "Sucursal Caballito",
    lat: -34.6187,
    lng: -58.4456,
    radiusMeters: 100,
    address: "Av. Rivadavia 5678, CABA",
  },
];

const DEMO_EMPLOYEES: DemoEmployeeSeed[] = [
  {
    email: "admin@demo.com",
    name: "Admin",
    lastName: "Demo",
    hourlyRate: 0,
    weeklyHours: 40,
    role: UserRole.ADMIN,
  },
  {
    email: "juan@demo.com",
    name: "Juan",
    lastName: "Pérez",
    hourlyRate: 1200,
    weeklyHours: 40,
    role: UserRole.EMPLOYEE,
  },
  {
    email: "maria@demo.com",
    name: "María",
    lastName: "González",
    hourlyRate: 1300,
    weeklyHours: 35,
    role: UserRole.EMPLOYEE,
  },
  {
    email: "pedro@demo.com",
    name: "Pedro",
    lastName: "López",
    hourlyRate: 1100,
    weeklyHours: 40,
    role: UserRole.EMPLOYEE,
  },
  {
    email: "lucia@demo.com",
    name: "Lucía",
    lastName: "Fernández",
    hourlyRate: 1250,
    weeklyHours: 30,
    role: UserRole.EMPLOYEE,
  },
];

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Last `count` workdays (Mon-Fri) ending today, newest first. Excludes today. */
function lastWorkdays(count: number): Date[] {
  const now = new Date();
  // Start from yesterday in Argentina time
  const arNow = new Date(now.getTime() + ARGENTINA_UTC_OFFSET_HOURS * 3600_000);
  const workdays: Date[] = [];

  for (let offset = 1; workdays.length < count; offset += 1) {
    const candidate = new Date(
      Date.UTC(arNow.getUTCFullYear(), arNow.getUTCMonth(), arNow.getUTCDate() - offset),
    );
    const dow = candidate.getUTCDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    workdays.push(candidate);
  }

  return workdays;
}

/** UTC Date for `hour` wall-clock in Argentina on the given UTC day. */
function arHour(startOfDayUtc: Date, hour: number): Date {
  return new Date(
    startOfDayUtc.getTime() + (hour - ARGENTINA_UTC_OFFSET_HOURS) * 3600_000,
  );
}

async function main(): Promise<void> {
  await waitForDb();

  // 1. Locations
  const existingLocations = await locationRepository.findAll();
  const locations: Location[] = [];

  for (const seed of DEMO_LOCATIONS) {
    const existing = existingLocations.find((l) => l.name === seed.name);
    if (existing) {
      locations.push(existing);
      console.log(`Location "${seed.name}" reused (id=${existing.id})`);
    } else {
      const created = await locationRepository.create(seed);
      locations.push(created);
      console.log(`Location "${seed.name}" created (id=${created.id})`);
    }
  }

  // 2. Employees + Supabase auth users
  const employeeRepo = AppDataSource.getRepository(Employee);
  const admin = createAdminClient();
  const employees: Employee[] = [];

  for (const seed of DEMO_EMPLOYEES) {
    const email = seed.email.trim().toLowerCase();

    // Find existing employee by email via raw query (repository has no findByEmail)
    const existing = await employeeRepo.findOne({ where: { email } });

    let employee: Employee;
    if (existing) {
      employee = existing;
      // Update role if missing
      if (!employee.role || employee.role !== seed.role) {
        await employeeRepo.update(employee.id, { role: seed.role });
        employee.role = seed.role;
        console.log(`Employee ${email} role updated to ${seed.role}`);
      }
      console.log(`Employee ${email} exists (id=${employee.id})`);
    } else {
      employee = await employeeRepo.save(
        employeeRepo.create({
          email,
          name: seed.name,
          lastName: seed.lastName,
          hourlyRate: seed.hourlyRate,
          weeklyHours: seed.weeklyHours,
          role: seed.role,
        }),
      );
      console.log(`Employee ${email} created (id=${employee.id})`);
    }
    employees.push(employee);

    // Supabase auth user — only if not linked yet
    if (employee.authUserId) {
      console.log(`Supabase user for ${email} already linked (${employee.authUserId})`);
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (error) {
      if (
        error.code === "user_already_exists" ||
        /already (?:registered|exists|been registered)/i.test(error.message)
      ) {
        // Look up the existing user by email and link authUserId
        const { data: listData } = await admin.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u) => u.email === email);
        if (existingUser) {
          await employeeRepository.update(employee.id, { authUserId: existingUser.id });
          console.log(`Supabase user for ${email} already registered — linked authUserId=${existingUser.id}`);
        } else {
          console.log(`Supabase user for ${email} already registered but not found — skipping`);
        }
        continue;
      }
      throw new Error(`createUser for ${email} failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error(`createUser for ${email} returned no user`);
    }

    await employeeRepository.update(employee.id, { authUserId: data.user.id });
    console.log(`Supabase user created and linked for ${email} (${data.user.id})`);
  }

  // 3. Attendance — only for employees with zero existing rows
  const workdays = lastWorkdays(WORK_WEEK_DAYS);
  const attendanceRepo = AppDataSource.getRepository(Attendance);

  for (const employee of employees) {
    const existing = await attendanceRepository.findByEmployee(employee.id);
    if (existing.length > 0) {
      console.log(`Attendance for ${employee.email} skipped (${existing.length} existing)`);
      continue;
    }

    let inserted = 0;
    for (let i = 0; i < workdays.length; i++) {
      const location = locations[i % locations.length];
      const day = workdays[i];

      for (const type of [AttendanceType.ENTRADA, AttendanceType.SALIDA]) {
        const hour = type === AttendanceType.ENTRADA ? ENTRY_HOUR : EXIT_HOUR;
        await attendanceRepo.save(
          attendanceRepo.create({
            employeeId: employee.id,
            type,
            timestamp: arHour(day, hour),
          }),
        );
        inserted++;
      }
    }
    console.log(`Attendance for ${employee.email}: ${inserted} rows (${workdays.length} workdays)`);
  }

  // 4. Setting
  await settingRepository.setValue("require_scan_photo", "false");
  console.log('Setting require_scan_photo = "false" upserted');

  // 5. Summary
  console.log("");
  console.log("=== Demo credentials (password for all: Demo1234!) ===");
  console.log("admin@demo.com / Demo1234!");
  console.log("juan@demo.com / Demo1234!");
  console.log("maria@demo.com / Demo1234!");
  console.log("pedro@demo.com / Demo1234!");
  console.log("lucia@demo.com / Demo1234!");
}

main().catch((error: unknown) => {
  console.error("Seed-demo-data failed:", error);
  process.exit(1);
});
