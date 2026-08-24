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

describe("EmployeeTurnService Logic", () => {
  // Pure function tests for turn-related logic
  function hasActiveTurns(turns: Array<{ active: boolean }>): boolean {
    return turns.some((t) => t.active);
  }

  function filterTurnsByDay(turns: Array<{ dayOfWeek: number; active: boolean }>, day: number) {
    return turns.filter((t) => t.dayOfWeek === day && t.active);
  }

  it("should detect active turns", () => {
    const turns = [
      { dayOfWeek: 0, active: true },
      { dayOfWeek: 1, active: false },
    ];
    expect(hasActiveTurns(turns)).toBe(true);
  });

  it("should detect no active turns", () => {
    const turns = [
      { dayOfWeek: 0, active: false },
      { dayOfWeek: 1, active: false },
    ];
    expect(hasActiveTurns(turns)).toBe(false);
  });

  it("should filter turns by day correctly", () => {
    const turns = [
      { dayOfWeek: 0, active: true },
      { dayOfWeek: 1, active: true },
      { dayOfWeek: 0, active: false },
    ];
    const mondayTurns = filterTurnsByDay(turns, 0);
    expect(mondayTurns).toHaveLength(1);
    expect(mondayTurns[0].dayOfWeek).toBe(0);
  });
});

describe("Rate Limiter Logic", () => {
  // Test the sliding window logic without external dependencies
  interface RateLimitEntry {
    count: number;
    resetAt: number;
  }

  function checkRateLimit(
    store: Map<string, RateLimitEntry>,
    key: string,
    windowMs: number,
    maxRequests: number
  ): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    entry.count++;
    return { allowed: true, remaining: maxRequests - entry.count };
  }

  it("should allow first request", () => {
    const store = new Map<string, RateLimitEntry>();
    const result = checkRateLimit(store, "test", 60000, 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should allow requests within limit", () => {
    const store = new Map<string, RateLimitEntry>();
    for (let i = 0; i < 4; i++) {
      checkRateLimit(store, "test", 60000, 5);
    }
    const result = checkRateLimit(store, "test", 60000, 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should block requests over limit", () => {
    const store = new Map<string, RateLimitEntry>();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(store, "test", 60000, 5);
    }
    const result = checkRateLimit(store, "test", 60000, 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset after window expires", () => {
    const store = new Map<string, RateLimitEntry>();
    // Set entry that expired
    store.set("test", { count: 5, resetAt: Date.now() - 1000 });
    const result = checkRateLimit(store, "test", 60000, 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});
