import "reflect-metadata";
import { createHash } from "node:crypto";
import { FindOperator } from "typeorm";
import { AppDataSource } from "@/backend/datasource";
import { webAuthnStepUpTokenRepository } from "@/backend/repositories/WebAuthnStepUpTokenRepository";

/**
 * The repository singleton grabs its TypeORM repository from the DataSource
 * at import time, so the mock must expose its stubs for assertions.
 */
jest.mock("@/backend/datasource", () => {
  const repositoryStub = {
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn(async (entity: unknown) => entity),
    update: jest.fn(),
    findOne: jest.fn(),
  };
  return {
    __stubs: { repositoryStub },
    AppDataSource: {
      getRepository: () => repositoryStub,
      transaction: jest.fn(),
    },
  };
});

const { __stubs } = jest.requireMock("@/backend/datasource") as {
  __stubs: {
    repositoryStub: {
      create: jest.Mock;
      save: jest.Mock;
      update: jest.Mock;
      findOne: jest.Mock;
    };
  };
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function consumeCriteria(callIndex = 0): Record<string, unknown> {
  return __stubs.repositoryStub.update.mock.calls[callIndex][0];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("WebAuthnStepUpTokenRepository.issue", () => {
  it("returns a 32-byte base64url raw token and stores only its hash", async () => {
    const nowBefore = Date.now();

    const rawToken = await webAuthnStepUpTokenRepository.issue(
      "emp-1",
      "entry"
    );

    // 32 bytes => 43 base64url chars, no padding.
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);

    expect(__stubs.repositoryStub.save).toHaveBeenCalledTimes(1);
    const persisted = __stubs.repositoryStub.create.mock.calls[0][0];
    expect(persisted.tokenHash).toBe(sha256(rawToken));
    expect(persisted.employeeId).toBe("emp-1");
    expect(persisted.intent).toBe("entry");

    const expectedExpiry = new Date(nowBefore + 120_000);
    expect((persisted.expiresAt as Date).getTime()).toBeGreaterThanOrEqual(
      expectedExpiry.getTime() - 2000
    );
    expect((persisted.expiresAt as Date).getTime()).toBeLessThanOrEqual(
      Date.now() + 120_000
    );
  });

  it("honors a custom ttl", async () => {
    await webAuthnStepUpTokenRepository.issue("emp-1", "exit", 30);

    const persisted = __stubs.repositoryStub.create.mock.calls[0][0];
    expect(
      (persisted.expiresAt as Date).getTime() - Date.now()
    ).toBeLessThanOrEqual(30_000);
  });

  it("rejects an intent outside entry/exit", async () => {
    await expect(
      webAuthnStepUpTokenRepository.issue(
        "emp-1",
        "bogus" as unknown as "entry"
      )
    ).rejects.toThrow(/invalid step-up intent/i);
    expect(__stubs.repositoryStub.save).not.toHaveBeenCalled();
  });
});

describe("WebAuthnStepUpTokenRepository.consume", () => {
  const RAW = "raw-token-value";
  const EMPLOYEE = "emp-1";

  it("consumes atomically and returns the token record on first use", async () => {
    __stubs.repositoryStub.update.mockResolvedValueOnce({ affected: 1 });
    const row = { id: "tok-1", tokenHash: sha256(RAW) };
    __stubs.repositoryStub.findOne.mockResolvedValueOnce(row);

    const result = await webAuthnStepUpTokenRepository.consume(
      RAW,
      EMPLOYEE,
      "entry"
    );

    expect(result).toBe(row);
    expect(__stubs.repositoryStub.findOne).toHaveBeenCalledWith({
      where: { tokenHash: sha256(RAW) },
    });

    // Atomic conditional UPDATE: unspent + unexpired + employee/intent bound.
    const criteria = consumeCriteria();
    expect(criteria.tokenHash).toBe(sha256(RAW));
    expect(criteria.employeeId).toBe(EMPLOYEE);
    expect(criteria.intent).toBe("entry");
    expect(criteria.consumedAt).toBeInstanceOf(FindOperator);
    expect((criteria.consumedAt as FindOperator<null>).type).toBe("isNull");
    expect(criteria.expiresAt).toBeInstanceOf(FindOperator);
    expect((criteria.expiresAt as FindOperator<Date>).type).toBe("moreThan");
    expect((criteria.expiresAt as FindOperator<Date>).value?.getTime()).toBeLessThanOrEqual(Date.now());

    // consumedAt is stamped with a concrete timestamp.
    expect(__stubs.repositoryStub.update.mock.calls[0][1]).toEqual({
      consumedAt: expect.any(Date),
    });
  });

  it("second consume of the same token returns null (already spent)", async () => {
    __stubs.repositoryStub.update
      .mockResolvedValueOnce({ affected: 1 }) // first use wins
      .mockResolvedValueOnce({ affected: 0 }); // consumedAt IS NULL no longer matches

    const first = await webAuthnStepUpTokenRepository.consume(
      RAW,
      EMPLOYEE,
      "entry"
    );
    const second = await webAuthnStepUpTokenRepository.consume(
      RAW,
      EMPLOYEE,
      "entry"
    );

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("expired tokens are rejected (expiresAt must be in the future)", async () => {
    __stubs.repositoryStub.update.mockResolvedValueOnce({ affected: 0 });

    const result = await webAuthnStepUpTokenRepository.consume(
      RAW,
      EMPLOYEE,
      "entry"
    );

    expect(result).toBeNull();
    expect(__stubs.repositoryStub.findOne).not.toHaveBeenCalled();
  });

  it("tokens bound to another employee are rejected", async () => {
    __stubs.repositoryStub.update.mockResolvedValueOnce({ affected: 0 });

    const result = await webAuthnStepUpTokenRepository.consume(
      RAW,
      "emp-other",
      "entry"
    );

    expect(result).toBeNull();
    expect(consumeCriteria().employeeId).toBe("emp-other");
  });

  it("tokens issued for a different intent are rejected", async () => {
    __stubs.repositoryStub.update.mockResolvedValueOnce({ affected: 0 });

    const result = await webAuthnStepUpTokenRepository.consume(
      RAW,
      EMPLOYEE,
      "exit"
    );

    expect(result).toBeNull();
    expect(consumeCriteria().intent).toBe("exit");
  });

  it("treats an undefined affected count as not consumed", async () => {
    __stubs.repositoryStub.update.mockResolvedValueOnce({});

    await expect(
      webAuthnStepUpTokenRepository.consume(RAW, EMPLOYEE, "entry")
    ).resolves.toBeNull();
  });
});
