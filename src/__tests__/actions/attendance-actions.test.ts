import "reflect-metadata";
import { AttendanceType } from "@/backend/models/Attendance";
import { UserRole } from "@/backend/models/Employee";

jest.mock("@/backend/services/AttendanceService", () => ({
  attendanceService: { record: jest.fn() },
}));
jest.mock("@/backend/services/EmployeeService", () => ({
  employeeService: {},
}));
jest.mock("@/backend/services/EmployeeTurnService", () => ({
  employeeTurnService: {},
}));
jest.mock("@/backend/datasource", () => ({
  waitForDb: jest.fn().mockResolvedValue(undefined),
  AppDataSource: { getRepository: jest.fn() },
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));
jest.mock("@/lib/auth/session", () => ({
  getSessionEmployee: jest.fn(),
}));
jest.mock("@/backend/repositories/WebAuthnStepUpTokenRepository", () => ({
  webAuthnStepUpTokenRepository: { consume: jest.fn() },
}));

import { recordAttendance, recordEntry, recordExit, updateAttendanceTimestamp } from "@/actions/attendanceActions";
import { attendanceService } from "@/backend/services/AttendanceService";
import { webAuthnStepUpTokenRepository } from "@/backend/repositories/WebAuthnStepUpTokenRepository";
import { getSessionEmployee } from "@/lib/auth/session";
import { AppDataSource } from "@/backend/datasource";

const mockGetSessionEmployee = getSessionEmployee as jest.Mock;
const mockConsume =
  webAuthnStepUpTokenRepository.consume as unknown as jest.Mock;
const mockRecord = attendanceService.record as unknown as jest.Mock;

const EMPLOYEE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "33333333-3333-4333-8333-333333333333";

const employeeSession = {
  id: EMPLOYEE_ID,
  role: UserRole.EMPLOYEE,
} as never;

const adminSession = { id: ADMIN_ID, role: UserRole.ADMIN } as never;

const recordedAttendance = {
  id: "att-1",
  employee_id: EMPLOYEE_ID,
  type: AttendanceType.ENTRADA,
  timestamp: new Date("2026-08-24T12:00:00Z"),
  created_at: new Date("2026-08-24T12:00:00Z"),
  employee: {
    id: EMPLOYEE_ID,
    name: "Ana",
    lastName: "Pérez",
    hourlyRate: 10,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRecord.mockResolvedValue(recordedAttendance);
});

describe("attendance identity binding", () => {
  it("rejects unauthenticated sessions", async () => {
    mockGetSessionEmployee.mockResolvedValue(null);

    const result = await recordEntry(EMPLOYEE_ID);

    expect(result.success).toBe(false);
    expect(result.code).toBe("unauthenticated");
    expect(mockRecord).not.toHaveBeenCalled();
    expect(mockConsume).not.toHaveBeenCalled();
  });

  it("forbids an employee recording for a different employee", async () => {
    mockGetSessionEmployee.mockResolvedValue(employeeSession);

    const result = await recordEntry(OTHER_ID, "some-token");

    expect(result.success).toBe(false);
    expect(result.code).toBe("forbidden");
    // Token must NOT be burned on a rejected cross-id attempt.
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("requires a step-up token for non-admin self-service", async () => {
    mockGetSessionEmployee.mockResolvedValue(employeeSession);

    const result = await recordEntry(EMPLOYEE_ID);

    expect(result.success).toBe(false);
    expect(result.code).toBe("step_up_required");
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("rejects invalid, expired or spent step-up tokens", async () => {
    mockGetSessionEmployee.mockResolvedValue(employeeSession);
    mockConsume.mockResolvedValue(null);

    const result = await recordEntry(EMPLOYEE_ID, "bad-token");

    expect(result.success).toBe(false);
    expect(result.code).toBe("step_up_invalid");
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("records a valid entry bound to the session employee", async () => {
    mockGetSessionEmployee.mockResolvedValue(employeeSession);
    mockConsume.mockResolvedValue({ id: "tok-1" } as never);

    const result = await recordEntry(EMPLOYEE_ID, "good-token");

    expect(result.success).toBe(true);
    expect(mockConsume).toHaveBeenCalledWith(
      "good-token",
      EMPLOYEE_ID,
      "entry"
    );
    expect(mockRecord).toHaveBeenCalledWith({
      employeeId: EMPLOYEE_ID,
      type: AttendanceType.ENTRADA,
    });
  });

  it("binds exit records to the exit intent", async () => {
    mockGetSessionEmployee.mockResolvedValue(employeeSession);
    mockConsume.mockResolvedValue({ id: "tok-2" } as never);

    await recordExit(EMPLOYEE_ID, "good-token");

    expect(mockConsume).toHaveBeenCalledWith(
      "good-token",
      EMPLOYEE_ID,
      "exit"
    );
    expect(mockRecord).toHaveBeenCalledWith({
      employeeId: EMPLOYEE_ID,
      type: AttendanceType.SALIDA,
    });
  });

  it("lets admins record for others without burning any token", async () => {
    mockGetSessionEmployee.mockResolvedValue(adminSession);

    const result = await recordEntry(EMPLOYEE_ID, "ignored-token");

    expect(result.success).toBe(true);
    expect(mockConsume).not.toHaveBeenCalled();
    expect(mockRecord).toHaveBeenCalledWith({
      employeeId: EMPLOYEE_ID,
      type: AttendanceType.ENTRADA,
    });
  });

  it("accepts admin recording for a different employee via direct call", async () => {
    mockGetSessionEmployee.mockResolvedValue(adminSession);

    await recordAttendance({
      employeeId: OTHER_ID,
      type: AttendanceType.SALIDA,
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: OTHER_ID })
    );
  });

  it("gates direct recordAttendance calls too (choke point)", async () => {
    mockGetSessionEmployee.mockResolvedValue(null);

    const result = await recordAttendance({
      employeeId: OTHER_ID,
      type: AttendanceType.ENTRADA,
      stepUpToken: "whatever",
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe("unauthenticated");
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("surfaces service errors without leaking authorization state", async () => {
    mockGetSessionEmployee.mockResolvedValue(adminSession);
    mockRecord.mockRejectedValue(
      new Error("Ya existe una entrada sin cerrar. Registra la salida primero.")
    );

    const result = await recordEntry(EMPLOYEE_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain("entrada sin cerrar");
  });
});

describe("updateAttendanceTimestamp admin gate", () => {
  const ATTENDANCE_ID = "att-1";
  const NEW_TIMESTAMP = new Date("2026-08-24T09:30:00Z");
  const storedAttendance = {
    id: ATTENDANCE_ID,
    employee_id: EMPLOYEE_ID,
    type: AttendanceType.ENTRADA,
    timestamp: new Date("2026-08-24T12:00:00Z"),
    created_at: new Date("2026-08-24T12:00:00Z"),
  };

  function mockAttendanceRepo() {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ ...storedAttendance }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repo);
    return repo;
  }

  it("rejects unauthenticated callers before touching the database", async () => {
    mockGetSessionEmployee.mockResolvedValue(null);
    const repo = mockAttendanceRepo();

    const result = await updateAttendanceTimestamp(ATTENDANCE_ID, NEW_TIMESTAMP);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("rejects non-admin employees (payroll-fraud gate)", async () => {
    mockGetSessionEmployee.mockResolvedValue(employeeSession);
    const repo = mockAttendanceRepo();

    const result = await updateAttendanceTimestamp(ATTENDANCE_ID, NEW_TIMESTAMP);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized");
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("lets admins rewrite the timestamp", async () => {
    mockGetSessionEmployee.mockResolvedValue(adminSession);
    const repo = mockAttendanceRepo();

    const result = await updateAttendanceTimestamp(ATTENDANCE_ID, NEW_TIMESTAMP);

    expect(result.success).toBe(true);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: ATTENDANCE_ID } });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: ATTENDANCE_ID, timestamp: NEW_TIMESTAMP })
    );
  });

  it("reports a missing attendance without saving anything", async () => {
    mockGetSessionEmployee.mockResolvedValue(adminSession);
    const repo = mockAttendanceRepo();
    repo.findOne.mockResolvedValue(null);

    const result = await updateAttendanceTimestamp("missing-id", NEW_TIMESTAMP);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Asistencia no encontrada");
    expect(repo.save).not.toHaveBeenCalled();
  });
});
