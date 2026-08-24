import { getWebAuthnConfig } from "@/lib/webauthn/config";

const SECRET_32_BYTES = "ab".repeat(32); // 64 hex chars

function applyEnv(values: Record<string, string | undefined>) {
  const keys = [
    "WEBAUTHN_RP_ID",
    "WEBAUTHN_RP_NAME",
    "WEBAUTHN_ORIGIN",
    "WEBAUTHN_STATE_SECRET",
  ];
  for (const key of keys) {
    const value = values[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("getWebAuthnConfig", () => {
  afterEach(() => applyEnv({}));

  it("returns full config when every variable is valid", () => {
    applyEnv({
      WEBAUTHN_RP_ID: "fichita.example.com",
      WEBAUTHN_RP_NAME: "Fichita",
      WEBAUTHN_ORIGIN: "https://fichita.example.com",
      WEBAUTHN_STATE_SECRET: SECRET_32_BYTES,
    });

    expect(getWebAuthnConfig()).toEqual({
      rpID: "fichita.example.com",
      rpName: "Fichita",
      expectedOrigin: "https://fichita.example.com",
      stateSecret: SECRET_32_BYTES,
    });
  });

  it("defaults rpName when WEBAUTHN_RP_NAME is omitted", () => {
    applyEnv({
      WEBAUTHN_RP_ID: "localhost",
      WEBAUTHN_ORIGIN: "http://localhost:3000",
      WEBAUTHN_STATE_SECRET: SECRET_32_BYTES,
    });

    const config = getWebAuthnConfig();
    expect(config?.rpName).toBe("Fichita");
  });

  it("accepts an http dev origin with port", () => {
    applyEnv({
      WEBAUTHN_RP_ID: "localhost",
      WEBAUTHN_ORIGIN: "http://localhost:3000",
      WEBAUTHN_STATE_SECRET: SECRET_32_BYTES,
    });

    expect(getWebAuthnConfig()?.expectedOrigin).toBe("http://localhost:3000");
  });

  it.each([
    ["missing rpID", { WEBAUTHN_ORIGIN: "https://x.com", WEBAUTHN_STATE_SECRET: SECRET_32_BYTES }],
    ["missing origin", { WEBAUTHN_RP_ID: "localhost", WEBAUTHN_STATE_SECRET: SECRET_32_BYTES }],
    ["missing state secret", { WEBAUTHN_RP_ID: "localhost", WEBAUTHN_ORIGIN: "https://x.com" }],
    [
      "origin with path",
      { WEBAUTHN_RP_ID: "localhost", WEBAUTHN_ORIGIN: "https://x.com/app", WEBAUTHN_STATE_SECRET: SECRET_32_BYTES },
    ],
    [
      "origin with query string",
      { WEBAUTHN_RP_ID: "localhost", WEBAUTHN_ORIGIN: "https://x.com/?a=1", WEBAUTHN_STATE_SECRET: SECRET_32_BYTES },
    ],
    [
      "state secret shorter than 32 bytes",
      { WEBAUTHN_RP_ID: "localhost", WEBAUTHN_ORIGIN: "https://x.com", WEBAUTHN_STATE_SECRET: "ab".repeat(31) },
    ],
    [
      "non-hex state secret",
      { WEBAUTHN_RP_ID: "localhost", WEBAUTHN_ORIGIN: "https://x.com", WEBAUTHN_STATE_SECRET: "z".repeat(64) },
    ],
    [
      "empty rpID",
      { WEBAUTHN_RP_ID: "", WEBAUTHN_ORIGIN: "https://x.com", WEBAUTHN_STATE_SECRET: SECRET_32_BYTES },
    ],
  ])("returns null for %s", (_name, env) => {
    applyEnv(env as Record<string, string>);
    expect(getWebAuthnConfig()).toBeNull();
  });
});
