import "reflect-metadata";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));
jest.mock("@/backend/datasource", () => ({
  waitForDb: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/lib/auth/session", () => ({
  getSessionEmployee: jest.fn(),
}));
jest.mock("@/backend/repositories/WebAuthnStepUpTokenRepository", () => ({
  webAuthnStepUpTokenRepository: { issue: jest.fn() },
}));
jest.mock("@/backend/services/AuditLogService", () => ({
  auditLogService: { log: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock("@/backend/services/SettingService", () => ({
  settingService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

import { createClient } from "@supabase/supabase-js";
import { verifyStepUpPassword } from "@/actions/webauthnActions";
import { webAuthnStepUpTokenRepository } from "@/backend/repositories/WebAuthnStepUpTokenRepository";
import { getSessionEmployee } from "@/lib/auth/session";

const mockCreateClient = createClient as jest.Mock;
const mockGetSessionEmployee = getSessionEmployee as jest.Mock;
const mockIssue =
  webAuthnStepUpTokenRepository.issue as unknown as jest.Mock;

// Each test uses a distinct employee id: the failure tracker is module-level
// state keyed by employee id and has no reset hook.
function sessionFor(id: string, email: string | null) {
  return { id, email, role: "employee" } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

  mockIssue.mockResolvedValue("issued-step-up-token");
});

describe("verifyStepUpPassword", () => {
  it("returns a step-up token on correct password", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("aaaa1111-1111-4111-8111-111111111111", "ana@fichita.com")
    );

    const result = await verifyStepUpPassword("correct-password", "entry");

    expect(result.success).toBe(true);
    expect(result.stepUpToken).toBe("issued-step-up-token");
    expect(mockIssue).toHaveBeenCalledWith(
      "aaaa1111-1111-4111-8111-111111111111",
      "entry"
    );
  });

  it("rejects a wrong password with a generic error and issues nothing", async () => {
    const signIn = jest.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("bbbb2222-2222-4222-8222-222222222222", "beto@fichita.com")
    );

    const result = await verifyStepUpPassword("wrong-password", "exit");

    expect(result.success).toBe(false);
    // Same generic message as other credential failures: no oracle for attackers.
    expect(result.error).toBe("Invalid credentials");
    expect(result.stepUpToken).toBeUndefined();
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("locks verification after 5 consecutive failures", async () => {
    const signIn = jest.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("cccc3333-3333-4333-8333-333333333333", "caro@fichita.com")
    );

    // Simulate settingService persistence: store lockout state in-memory
    const settingStore = new Map<string, string>();
    const settingService = require("@/backend/services/SettingService").settingService;
    settingService.get.mockImplementation(async (key: string) => settingStore.get(key) ?? null);
    settingService.set.mockImplementation(async (key: string, value: string) => { settingStore.set(key, value); });

    for (let i = 0; i < 5; i++) {
      const result = await verifyStepUpPassword("still-wrong", "entry");
      expect(result.success).toBe(false);
    }
    expect(signIn).toHaveBeenCalledTimes(5);

    const locked = await verifyStepUpPassword("even-if-correct", "entry");

    expect(locked.success).toBe(false);
    expect(locked.error).toBe("Too many attempts. Please wait and try again.");
    // Locked requests must not even reach Supabase.
    expect(signIn).toHaveBeenCalledTimes(5);
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("binds the issued token to the requested intent", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });

    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("dddd4444-4444-4444-8444-444444444444", "dani@fichita.com")
    );
    await verifyStepUpPassword("password", "entry");
    expect(mockIssue).toHaveBeenLastCalledWith(
      "dddd4444-4444-4444-8444-444444444444",
      "entry"
    );

    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("eeee5555-5555-4555-8555-555555555555", "eva@fichita.com")
    );
    await verifyStepUpPassword("password", "exit");
    expect(mockIssue).toHaveBeenLastCalledWith(
      "eeee5555-5555-4555-8555-555555555555",
      "exit"
    );
  });

  it("rejects an unknown intent before any authentication happens", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("ffff6666-6666-4666-8666-666666666666", "fede@fichita.com")
    );

    const result = await verifyStepUpPassword(
      "password",
      // Runtime garbage despite the static type — server actions receive raw input.
      "reset" as never
    );

    expect(result.success).toBe(false);
    expect(signIn).not.toHaveBeenCalled();
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it("derives identity from the session, never from client input", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("aaaa7777-7777-4777-8777-777777777777", "session@fichita.com")
    );

    await verifyStepUpPassword("whatever-password", "entry");

    // The action signature has no email parameter; the email used for
    // re-authentication must come from the verified session employee.
    expect(signIn).toHaveBeenCalledWith({
      email: "session@fichita.com",
      password: "whatever-password",
    });
    expect(mockIssue).toHaveBeenCalledWith(
      "aaaa7777-7777-4777-8777-777777777777",
      "entry"
    );
  });

  it("rejects unauthenticated callers", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(null);

    const result = await verifyStepUpPassword("password", "entry");

    expect(result.success).toBe(false);
    expect(result.error).toBe("You must be signed in");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("fails closed when the session employee has no linked email", async () => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("bbbb8888-8888-4888-8888-888888888888", null)
    );

    const result = await verifyStepUpPassword("password", "entry");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credentials");
    expect(signIn).not.toHaveBeenCalled();
    expect(mockIssue).not.toHaveBeenCalled();
  });

  it.each([
    ["empty string", ""],
    ["over-long password", "x".repeat(129)],
  ])("validates password input (%s) without contacting Supabase", async (_label, password) => {
    const signIn = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("cccc9999-9999-4999-8999-999999999999", "gabi@fichita.com")
    );

    const result = await verifyStepUpPassword(password, "entry");

    expect(result.success).toBe(false);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("clears the failure counter after a success", async () => {
    const signIn = jest
      .fn()
      .mockResolvedValueOnce({ error: { message: "no" } })
      .mockResolvedValueOnce({ error: { message: "no" } })
      .mockResolvedValueOnce({ error: { message: "no" } })
      .mockResolvedValueOnce({ error: { message: "no" } })
      .mockResolvedValueOnce({ error: null }); // 5th attempt succeeds → counter resets

    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: signIn } });
    mockGetSessionEmployee.mockResolvedValue(
      sessionFor("dddd0000-0000-4000-8000-000000000000", "hebe@fichita.com")
    );

    for (let i = 0; i < 4; i++) {
      await verifyStepUpPassword("wrong", "entry");
    }
    const recovered = await verifyStepUpPassword("right", "entry");
    expect(recovered.success).toBe(true);

    // Counter was reset by success: one more failure must NOT be a lockout.
    signIn.mockResolvedValue({ error: { message: "no" } });
    const freshFailure = await verifyStepUpPassword("wrong-again", "entry");
    expect(freshFailure.error).toBe("Invalid credentials");
    expect(freshFailure.error).not.toBe("Too many attempts. Please wait and try again.");
  });
});
