import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import {
  STATE_TTL_SECONDS,
  WEBAUTHN_STATE_COOKIE,
  clearStateCookie,
  readStateCookie,
  setStateCookie,
  signState,
  verifyState,
} from "@/lib/auth/state-cookie";

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

const cookiesMock = cookies as jest.Mock;

const SECRET = "ab".repeat(32); // 64 hex chars = 32 bytes
const ENV_KEYS = [
  "WEBAUTHN_RP_ID",
  "WEBAUTHN_RP_NAME",
  "WEBAUTHN_ORIGIN",
  "WEBAUTHN_STATE_SECRET",
] as const;

function applyEnv(values: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = values[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function fullEnv(): Record<string, string> {
  return {
    WEBAUTHN_RP_ID: "localhost",
    WEBAUTHN_RP_NAME: "Fichita",
    WEBAUTHN_ORIGIN: "http://localhost:3000",
    WEBAUTHN_STATE_SECRET: SECRET,
  };
}

function signRegistration(
  overrides: Partial<Parameters<typeof signState>[0]> = {}
) {
  return signState({
    challenge: "challenge-abc",
    employeeId: "emp-1",
    kind: "registration",
    ...overrides,
  });
}

/** Recomputes a valid signature for an arbitrary signing input. */
function forgeSignature(signingInput: string): string {
  return createHmac("sha256", Buffer.from(SECRET, "hex"))
    .update(signingInput)
    .digest("base64url");
}

function mockCookieStore() {
  const store = { get: jest.fn(), set: jest.fn() };
  cookiesMock.mockResolvedValue(store);
  return store;
}

describe("signState / verifyState", () => {
  beforeEach(() => {
    applyEnv(fullEnv());
  });

  afterEach(() => {
    applyEnv({});
    jest.useRealTimers();
  });

  it("round-trips a signed token back to its payload", () => {
    const { token, maxAgeSeconds } = signRegistration();

    expect(maxAgeSeconds).toBe(STATE_TTL_SECONDS);
    expect(token.split(".")).toHaveLength(2);

    const payload = verifyState(token, "registration");
    expect(payload).not.toBeNull();
    expect(payload!.challenge).toBe("challenge-abc");
    expect(payload!.employeeId).toBe("emp-1");
    expect(payload!.kind).toBe("registration");
    expect(payload!.exp - payload!.iat).toBe(STATE_TTL_SECONDS);
    expect(payload!.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });

  it("honors a custom ttlSeconds", () => {
    const { maxAgeSeconds } = signRegistration({ ttlSeconds: 60 });
    expect(maxAgeSeconds).toBe(60);
  });

  it("rejects a tampered payload with the original signature", () => {
    const { token } = signRegistration();
    const [signingInput] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(signingInput, "base64url").toString("utf8")
    );
    decoded.employeeId = "emp-victim";
    const tamperedInput = Buffer.from(JSON.stringify(decoded)).toString(
      "base64url"
    );
    const [, originalSignature] = token.split(".");

    expect(verifyState(`${tamperedInput}.${originalSignature}`, "registration")).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const { token } = signRegistration();
    const [signingInput] = token.split(".");
    const forged = Buffer.from("forged-signature-bytes-padding!").toString(
      "base64url"
    );

    expect(verifyState(`${signingInput}.${forged}`, "registration")).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const { token } = signRegistration();

    applyEnv({ ...fullEnv(), WEBAUTHN_STATE_SECRET: "cd".repeat(32) });
    expect(verifyState(token, "registration")).toBeNull();
  });

  it("rejects an already-expired token", () => {
    const { token } = signRegistration({ ttlSeconds: -10 });
    expect(verifyState(token, "registration")).toBeNull();
  });

  it("rejects a token after its ttl elapses", () => {
    jest.useFakeTimers();
    const { token } = signRegistration();

    jest.advanceTimersByTime((STATE_TTL_SECONDS + 1) * 1000);
    expect(verifyState(token, "registration")).toBeNull();
  });

  it("accepts a token one second before expiry", () => {
    jest.useFakeTimers();
    const { token } = signRegistration();

    jest.advanceTimersByTime((STATE_TTL_SECONDS - 1) * 1000);
    expect(verifyState(token, "registration")).not.toBeNull();
  });

  it("rejects a kind mismatch between sign and verify", () => {
    const { token } = signRegistration();
    expect(verifyState(token, "assertion")).toBeNull();
    expect(verifyState(token, "registration")).not.toBeNull();
  });

  it.each([
    ["no separator", "garbage-token"],
    ["too many segments", "a.b.c"],
    ["empty payload segment", ".c2ln"],
    ["empty signature segment", `${Buffer.from("{}").toString("base64url")}.`],
    [
      "payload is not JSON",
      `${Buffer.from("not json at all").toString("base64url")}.${forgeSignature(Buffer.from("not json at all").toString("base64url"))}`,
    ],
    [
      "payload JSON has wrong shape",
      `${Buffer.from('{"foo":1}').toString("base64url")}.${forgeSignature(Buffer.from('{"foo":1}').toString("base64url"))}`,
    ],
    [
      "signature is not valid base64url",
      `${Buffer.from("{}").toString("base64url")}.!!!not-base64!!!`,
    ],
  ])("returns null for %s", (_name, badToken) => {
    expect(verifyState(badToken, "registration")).toBeNull();
  });

  it("returns null when the WebAuthn config is missing", () => {
    const { token } = signRegistration(); // signed while env existed

    applyEnv({});
    expect(verifyState(token, "registration")).toBeNull();
  });

  it("throws on signState when the WebAuthn config is missing", () => {
    applyEnv({});
    expect(() =>
      signState({ challenge: "c", employeeId: "e", kind: "assertion" })
    ).toThrow(/configuration missing/i);
  });
});

describe("state cookie helpers", () => {
  beforeEach(() => {
    applyEnv(fullEnv());
  });

  afterEach(() => {
    applyEnv({});
    process.env.NODE_ENV = "test";
  });

  it("sets the cookie with httpOnly, lax, path=/ and the given maxAge in test env", async () => {
    const store = mockCookieStore();
    process.env.NODE_ENV = "test";

    await setStateCookie("token-value", 120);

    expect(store.set).toHaveBeenCalledWith(WEBAUTHN_STATE_COOKIE, "token-value", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 120,
    });
  });

  it("marks the cookie secure outside development/test environments", async () => {
    const store = mockCookieStore();
    process.env.NODE_ENV = "production";

    await setStateCookie("token-value", 120);

    expect(store.set).toHaveBeenCalledWith(
      WEBAUTHN_STATE_COOKIE,
      "token-value",
      expect.objectContaining({ secure: true, httpOnly: true })
    );
  });

  it("clears the cookie with an empty value and maxAge 0", async () => {
    const store = mockCookieStore();

    await clearStateCookie();

    expect(store.set).toHaveBeenCalledWith(WEBAUTHN_STATE_COOKIE, "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  });

  it("readStateCookie verifies and returns the stored payload", async () => {
    const store = mockCookieStore();
    const { token } = signRegistration({ kind: "assertion", challenge: "c9" });
    store.get.mockReturnValue({ name: WEBAUTHN_STATE_COOKIE, value: token });

    const payload = await readStateCookie("assertion");

    expect(payload).toMatchObject({ challenge: "c9", kind: "assertion" });
    expect(store.get).toHaveBeenCalledWith(WEBAUTHN_STATE_COOKIE);
  });

  it("readStateCookie returns null when the cookie is absent or invalid", async () => {
    const store = mockCookieStore();
    store.get.mockReturnValue(undefined);
    await expect(readStateCookie("registration")).resolves.toBeNull();

    const { token } = signRegistration();
    store.get.mockReturnValue({
      name: WEBAUTHN_STATE_COOKIE,
      value: `${token}x`,
    });
    await expect(readStateCookie("registration")).resolves.toBeNull();
  });
});
