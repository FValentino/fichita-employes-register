import "reflect-metadata";
import { createHash } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { webAuthService } from "@/backend/services/WebAuthService";
import { webAuthnCredentialRepository } from "@/backend/repositories/WebAuthnCredentialRepository";
import { webAuthnStepUpTokenRepository } from "@/backend/repositories/WebAuthnStepUpTokenRepository";
import { auditLogService } from "@/backend/services/AuditLogService";

/**
 * Both repository singletons grab their TypeORM repositories at import time,
 * so the DataSource is mocked with entity-aware stubs exposed via `__stubs`.
 */
jest.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

jest.mock("@/backend/datasource", () => {
  const managerStub = {
    delete: jest.fn(),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn(async (entity: unknown) => entity),
  };
  /** One stub per model — resolved by class name inside getRepository(). */
  const repoStubs: Record<string, Record<string, jest.Mock>> = {
    WebAuthnCredential: {
      findOne: jest.fn(),
      update: jest.fn(async () => ({ affected: 1 })),
    },
    WebAuthnStepUpToken: {
      create: jest.fn((data: object) => ({ ...data })),
      save: jest.fn(async (entity: unknown) => entity),
      findOne: jest.fn(),
      update: jest.fn(async () => ({ affected: 1 })),
    },
  };
  return {
    __stubs: { managerStub, repoStubs },
    AppDataSource: {
      getRepository: (entity: { name: string }) => repoStubs[entity.name],
      transaction: async (work: (manager: unknown) => unknown) =>
        work(managerStub),
    },
  };
});

jest.mock("@/backend/services/AuditLogService", () => ({
  auditLogService: { log: jest.fn(async () => ({})) },
}));

const { __stubs } = jest.requireMock("@/backend/datasource") as {
  __stubs: {
    managerStub: { delete: jest.Mock; create: jest.Mock; save: jest.Mock };
    repoStubs: Record<
      "WebAuthnCredential" | "WebAuthnStepUpToken",
      Record<string, jest.Mock>
    >;
  };
};

const credentialDb = __stubs.repoStubs.WebAuthnCredential;
const tokenDb = __stubs.repoStubs.WebAuthnStepUpToken;

const genRegistrationOptions = generateRegistrationOptions as jest.Mock;
const verifyRegistration = verifyRegistrationResponse as jest.Mock;
const genAuthenticationOptions = generateAuthenticationOptions as jest.Mock;
const verifyAuthentication = verifyAuthenticationResponse as jest.Mock;

const WEB_AUTHN_ENV = {
  WEBAUTHN_RP_ID: "fichita.example.com",
  WEBAUTHN_RP_NAME: "Fichita",
  WEBAUTHN_ORIGIN: "https://fichita.example.com",
  WEBAUTHN_STATE_SECRET: "ab".repeat(32),
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, ...WEB_AUTHN_ENV };
  jest.clearAllMocks();
});

afterAll(() => {
  process.env = originalEnv;
});

const employee = { id: "emp-1", email: "emp@fichita.dev" } as never;

/** Stored credential row as it comes out of the database. */
const storedCredential = {
  id: "cred-1",
  employeeId: "emp-1",
  credentialId: "stored-credential-id",
  credentialPublicKey: "c29tZS1jb3NlLWtleQ", // valid base64url
  counter: 3,
  transports: ["internal"],
  deviceType: "singleDevice",
  backedUp: false,
  label: null,
  revokedAt: null,
};

const registrationResponse = {} as unknown as RegistrationResponseJSON;
const assertionResponse = {} as unknown as AuthenticationResponseJSON;

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

describe("WebAuthService — startRegistration", () => {
  it("generates options bound to the RP config and the employee email", async () => {
    credentialDb.findOne.mockResolvedValueOnce(null);
    const options = { challenge: "reg-challenge", rp: {} };
    genRegistrationOptions.mockResolvedValueOnce(options);

    const result = await webAuthService.startRegistration(employee);

    expect(result).toBe(options);
    expect(genRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        rpName: "Fichita",
        rpID: "fichita.example.com",
        userName: "emp@fichita.dev",
        attestationType: "none",
        excludeCredentials: [],
        authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
      })
    );
  });

  it("excludes the existing active credential from re-registration", async () => {
    credentialDb.findOne.mockResolvedValueOnce({ ...storedCredential });

    await webAuthService.startRegistration(employee);

    expect(genRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeCredentials: [
          { id: storedCredential.credentialId, transports: ["internal"] },
        ],
      })
    );
  });

  it("does not exclude a revoked credential so the same device can re-enroll", async () => {
    credentialDb.findOne.mockResolvedValueOnce({
      ...storedCredential,
      revokedAt: new Date(),
    });

    await webAuthService.startRegistration(employee);

    expect(genRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({ excludeCredentials: [] })
    );
  });
});

describe("WebAuthService — finishRegistration", () => {
  const cosePublicKey = new Uint8Array([1, 2, 3, 4]);

  function mockVerifiedRegistration() {
    verifyRegistration.mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        fmt: "none",
        aaguid: "adce0002-35bc-c60a-648b-0b25f1f05503",
        credential: {
          id: "new-credential-id",
          publicKey: cosePublicKey,
          counter: 0,
          transports: ["internal"],
        },
        credentialType: "public-key",
        userVerified: true,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        origin: WEB_AUTHN_ENV.WEBAUTHN_ORIGIN,
        rpID: WEB_AUTHN_ENV.WEBAUTHN_RP_ID,
      },
    });
  }

  it("verifies against config values and persists the credential", async () => {
    mockVerifiedRegistration();
    credentialDb.findOne.mockResolvedValueOnce(null); // no credential_id collision

    const credential = await webAuthService.finishRegistration(
      "emp-1",
      registrationResponse,
      "expected-challenge"
    );

    expect(verifyRegistration).toHaveBeenCalledWith({
      response: registrationResponse,
      expectedChallenge: "expected-challenge",
      expectedOrigin: "https://fichita.example.com",
      expectedRPID: "fichita.example.com",
      requireUserVerification: true,
    });

    // COSE public key bytes are stored base64url-encoded.
    expect(credential).toMatchObject({
      employeeId: "emp-1",
      credentialId: "new-credential-id",
      credentialPublicKey: Buffer.from(cosePublicKey).toString("base64url"),
      counter: 0,
      transports: ["internal"],
      deviceType: "singleDevice",
      backedUp: false,
    });
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "enroll", entityId: "emp-1" })
    );
  });

  it("re-enrollment replaces the previous credential atomically", async () => {
    mockVerifiedRegistration();
    // Same authenticator already owned by THIS employee → not a collision.
    credentialDb.findOne.mockResolvedValueOnce({
      ...storedCredential,
      credentialId: "new-credential-id",
    });

    const credential = await webAuthService.finishRegistration(
      "emp-1",
      registrationResponse,
      "challenge"
    );

    expect(credential.employeeId).toBe("emp-1");
    // Replacement runs delete + insert inside one transaction.
    expect(__stubs.managerStub.delete).toHaveBeenCalledWith(
      expect.anything(),
      { employeeId: "emp-1" }
    );
    expect(__stubs.managerStub.create).toHaveBeenCalled();
    expect(
      __stubs.managerStub.delete.mock.invocationCallOrder[0]
    ).toBeLessThan(__stubs.managerStub.create.mock.invocationCallOrder[0]);
  });

  it("rejects when the credentialId is bound to a different employee", async () => {
    mockVerifiedRegistration();
    credentialDb.findOne.mockResolvedValueOnce({
      ...storedCredential,
      employeeId: "emp-other",
    });

    await expect(
      webAuthService.finishRegistration("emp-1", registrationResponse, "ch")
    ).rejects.toThrow(/already registered/);

    expect(__stubs.managerStub.delete).not.toHaveBeenCalled();
    expect(__stubs.managerStub.create).not.toHaveBeenCalled();
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "credential_taken" })
    );
  });

  it("rejects an unverified response without persisting anything", async () => {
    verifyRegistration.mockResolvedValueOnce({ verified: false });

    await expect(
      webAuthService.finishRegistration("emp-1", registrationResponse, "ch")
    ).rejects.toThrow(/could not be verified/i);

    expect(__stubs.managerStub.delete).not.toHaveBeenCalled();
  });
});

describe("WebAuthService — startAssertion", () => {
  it("generates options allowing only the stored credential", async () => {
    credentialDb.findOne.mockResolvedValueOnce({ ...storedCredential });
    const options = { challenge: "assert-challenge" };
    genAuthenticationOptions.mockResolvedValueOnce(options);

    const result = await webAuthService.startAssertion("emp-1");

    expect(result).toBe(options);
    expect(genAuthenticationOptions).toHaveBeenCalledWith({
      rpID: "fichita.example.com",
      allowCredentials: [
        { id: storedCredential.credentialId, transports: ["internal"] },
      ],
      userVerification: "required",
    });
  });

  it("fails when the employee has no credential", async () => {
    credentialDb.findOne.mockResolvedValueOnce(null);

    await expect(webAuthService.startAssertion("emp-1")).rejects.toThrow(
      /No credential enrolled/
    );
    expect(genAuthenticationOptions).not.toHaveBeenCalled();
  });

  it("fails when the credential is revoked", async () => {
    credentialDb.findOne.mockResolvedValueOnce({
      ...storedCredential,
      revokedAt: new Date(),
    });

    await expect(webAuthService.startAssertion("emp-1")).rejects.toThrow(
      /revoked/
    );
    expect(genAuthenticationOptions).not.toHaveBeenCalled();
  });
});

describe("WebAuthService — finishAssertion", () => {
  function mockVerifiedAssertion(newCounter: number) {
    verifyAuthentication.mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: storedCredential.credentialId,
        newCounter,
        userVerified: true,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        origin: WEB_AUTHN_ENV.WEBAUTHN_ORIGIN,
        rpID: WEB_AUTHN_ENV.WEBAUTHN_RP_ID,
      },
    });
  }

  it("verifies against the stored key, updates the counter and issues a token", async () => {
    credentialDb.findOne.mockResolvedValueOnce({ ...storedCredential });
    mockVerifiedAssertion(4);

    const rawToken = await webAuthService.finishAssertion(
      "emp-1",
      assertionResponse,
      "expected-challenge",
      "entry"
    );

    // Stored public key is handed to SimpleWebAuthn as raw bytes.
    const swaCall = verifyAuthentication.mock.calls[0][0];
    expect(swaCall).toMatchObject({
      expectedChallenge: "expected-challenge",
      expectedOrigin: "https://fichita.example.com",
      expectedRPID: "fichita.example.com",
      requireUserVerification: true,
    });
    expect(swaCall.credential.id).toBe(storedCredential.credentialId);
    expect(swaCall.credential.counter).toBe(3);
    expect(Buffer.from(swaCall.credential.publicKey).toString("base64url")).toBe(
      storedCredential.credentialPublicKey
    );

    // Counter advanced and lastUsedAt stamped.
    expect(credentialDb.update).toHaveBeenCalledWith("cred-1", {
      counter: 4,
      lastUsedAt: expect.any(Date),
    });

    // A fresh opaque token bound to employee + intent comes back.
    expect(typeof rawToken).toBe("string");
    expect(rawToken.length).toBeGreaterThan(20);
    expect(tokenDb.create).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: "emp-1",
        intent: "entry",
        tokenHash: sha256Hex(rawToken),
      })
    );
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "assert_success" })
    );
  });

  it.each([
    ["equal counters (replay)", 3],
    ["counter regression (clone)", 2],
  ])("rejects %s and revokes the credential", async (_label, newCounter) => {
    credentialDb.findOne.mockResolvedValueOnce({ ...storedCredential });
    mockVerifiedAssertion(newCounter);

    await expect(
      webAuthService.finishAssertion("emp-1", assertionResponse, "ch", "exit")
    ).rejects.toThrow(/counter regression/i);

    expect(credentialDb.update).toHaveBeenCalledWith("cred-1", {
      revokedAt: expect.any(Date),
    });
    expect(credentialDb.update).not.toHaveBeenCalledWith(
      "cred-1",
      expect.objectContaining({ counter: newCounter })
    );
    expect(tokenDb.create).not.toHaveBeenCalled();
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "counter_regression" })
    );
  });

  it("allows a counter-less authenticator reporting 0 again", async () => {
    credentialDb.findOne.mockResolvedValueOnce({
      ...storedCredential,
      counter: 0,
    });
    mockVerifiedAssertion(0);

    const rawToken = await webAuthService.finishAssertion(
      "emp-1",
      assertionResponse,
      "ch",
      "entry"
    );

    expect(typeof rawToken).toBe("string");
    expect(tokenDb.create).toHaveBeenCalled();
  });

  it("fails on unverified responses without issuing tokens", async () => {
    credentialDb.findOne.mockResolvedValueOnce({ ...storedCredential });
    verifyAuthentication.mockResolvedValueOnce({ verified: false });

    await expect(
      webAuthService.finishAssertion("emp-1", assertionResponse, "ch", "entry")
    ).rejects.toThrow(/could not be verified/i);

    expect(credentialDb.update).not.toHaveBeenCalled();
    expect(tokenDb.create).not.toHaveBeenCalled();
    expect(auditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "assert_failed" })
    );
  });
});

describe("WebAuthService — step-up token lifecycle", () => {
  it("issued tokens are single-use: the second consume fails", async () => {
    credentialDb.findOne.mockResolvedValueOnce({ ...storedCredential });
    verifyAuthentication.mockResolvedValueOnce({
      verified: true,
      authenticationInfo: {
        credentialID: storedCredential.credentialId,
        newCounter: 4,
        userVerified: true,
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        origin: WEB_AUTHN_ENV.WEBAUTHN_ORIGIN,
        rpID: WEB_AUTHN_ENV.WEBAUTHN_RP_ID,
      },
    });

    const rawToken = await webAuthService.finishAssertion(
      "emp-1",
      assertionResponse,
      "ch",
      "entry"
    );

    // Consumption is an atomic conditional UPDATE on the hash…
    const consumeCriteria = {
      tokenHash: sha256Hex(rawToken),
      employeeId: "emp-1",
      intent: "entry",
    };

    // …first presentation flips consumed_at and wins.
    tokenDb.update.mockResolvedValueOnce({ affected: 1 });
    tokenDb.findOne.mockResolvedValueOnce({
      id: "tok-1",
      ...consumeCriteria,
      consumedAt: new Date(),
    });
    await expect(
      webAuthnStepUpTokenRepository.consume(rawToken, "emp-1", "entry")
    ).resolves.toMatchObject({ id: "tok-1" });
    expect(tokenDb.update).toHaveBeenLastCalledWith(
      expect.objectContaining(consumeCriteria),
      expect.anything()
    );

    // …the replay updates zero rows and gets nothing back.
    tokenDb.update.mockResolvedValueOnce({ affected: 0 });
    await expect(
      webAuthnStepUpTokenRepository.consume(rawToken, "emp-1", "entry")
    ).resolves.toBeNull();

    // Only the SHA-256 digest ever reaches persistence.
    expect(tokenDb.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ tokenHash: rawToken })
    );
  });
});

describe("WebAuthService — configuration guard", () => {
  it("throws a typed error when WebAuthn env vars are missing", async () => {
    process.env = { ...originalEnv };
    delete process.env.WEBAUTHN_RP_ID;

    await expect(webAuthService.startRegistration(employee)).rejects.toThrow(
      /not configured/
    );
    await expect(webAuthService.startAssertion("emp-1")).rejects.toThrow(
      /not configured/
    );
  });
});

describe("WebAuthService — audit trail never breaks ceremonies", () => {
  it("swallows audit persistence failures on successful enrollment", async () => {
    (auditLogService.log as jest.Mock).mockRejectedValueOnce(
      new Error("audit db down")
    );
    verifyRegistration.mockResolvedValueOnce({
      verified: true,
      registrationInfo: {
        fmt: "none",
        aaguid: "",
        credential: {
          id: "new-credential-id",
          publicKey: new Uint8Array([9]),
          counter: 0,
          transports: undefined,
        },
        credentialType: "public-key",
        userVerified: true,
        credentialDeviceType: "multiDevice",
        credentialBackedUp: true,
        origin: WEB_AUTHN_ENV.WEBAUTHN_ORIGIN,
        rpID: WEB_AUTHN_ENV.WEBAUTHN_RP_ID,
      },
    });
    credentialDb.findOne.mockResolvedValueOnce(null);

    await expect(
      webAuthService.finishRegistration("emp-1", registrationResponse, "ch")
    ).resolves.toMatchObject({ employeeId: "emp-1" });
  });
});
