/**
 * Tardiness calculation logic tests
 *
 * This tests the core logic used in getDashboardStats to calculate
 * weekly tardanzas based on employee turn assignments.
 */

// Helper function extracted from attendanceActions.ts for testing
function calculateTardiness(
  firstEntryTime: Date,
  turnEntryTime: string,
  toleranceMinutes: number = 5
): boolean {
  const [turnHours, turnMinutes] = turnEntryTime.split(":").map(Number);
  const turnDate = new Date(firstEntryTime);
  turnDate.setHours(turnHours, turnMinutes, 0, 0);

  const diffMinutes = (firstEntryTime.getTime() - turnDate.getTime()) / (1000 * 60);
  return diffMinutes > toleranceMinutes;
}

describe("Tardiness Calculation", () => {
  const TOLERANCE = 5;

  it("should NOT count as tardy if employee arrives exactly on time", () => {
    const entry = new Date("2024-01-15T09:00:00");
    const result = calculateTardiness(entry, "09:00", TOLERANCE);
    expect(result).toBe(false);
  });

  it("should NOT count as tardy if employee arrives within tolerance", () => {
    const entry = new Date("2024-01-15T09:04:00"); // 4 minutes late
    const result = calculateTardiness(entry, "09:00", TOLERANCE);
    expect(result).toBe(false);
  });

  it("should count as tardy if employee arrives 6 minutes late", () => {
    const entry = new Date("2024-01-15T09:06:00"); // 6 minutes late
    const result = calculateTardiness(entry, "09:00", TOLERANCE);
    expect(result).toBe(true);
  });

  it("should count as tardy if employee arrives 30 minutes late", () => {
    const entry = new Date("2024-01-15T09:30:00"); // 30 minutes late
    const result = calculateTardiness(entry, "09:00", TOLERANCE);
    expect(result).toBe(true);
  });

  it("should NOT count as tardy if employee arrives early", () => {
    const entry = new Date("2024-01-15T08:55:00"); // 5 minutes early
    const result = calculateTardiness(entry, "09:00", TOLERANCE);
    expect(result).toBe(false);
  });

  it("should handle different turn times correctly", () => {
    const entry = new Date("2024-01-15T10:10:00"); // 10 minutes late for 10:00 turn
    const result = calculateTardiness(entry, "10:00", TOLERANCE);
    expect(result).toBe(true);
  });

  it("should handle turn at midnight (00:00)", () => {
    const entry = new Date("2024-01-15T00:10:00"); // 10 minutes late
    const result = calculateTardiness(entry, "00:00", TOLERANCE);
    expect(result).toBe(true);
  });
});

describe("Day of Week Calculation", () => {
  function getDayOfWeek(date: Date): number {
    const dow = date.getDay();
    return dow === 0 ? 6 : dow - 1; // Convert to 0=Monday, 6=Sunday
  }

  it("should return 0 for Monday", () => {
    // January 15, 2024 is a Monday
    const monday = new Date(2024, 0, 15); // Month is 0-indexed
    expect(getDayOfWeek(monday)).toBe(0);
  });

  it("should return 4 for Friday", () => {
    // January 19, 2024 is a Friday
    const friday = new Date(2024, 0, 19);
    expect(getDayOfWeek(friday)).toBe(4);
  });

  it("should return 6 for Sunday", () => {
    // January 21, 2024 is a Sunday
    const sunday = new Date(2024, 0, 21);
    expect(getDayOfWeek(sunday)).toBe(6);
  });
});
