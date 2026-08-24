import "reflect-metadata";
import { AppDataSource } from "@/backend/datasource";
import {
  webAuthnCredentialRepository,
  type RegisterCredentialData,
} from "@/backend/repositories/WebAuthnCredentialRepository";
import { WebAuthnCredential } from "@/backend/models/WebAuthnCredential";

/**
 * The repository singleton grabs its TypeORM repository from the DataSource
 * at import time, so the mock must expose its stubs for assertions.
 */
jest.mock("@/backend/datasource", () => {
  const managerStub = {
    delete: jest.fn(),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn(async (entity: unknown) => entity),
  };
  const repositoryStub = {
    findOne: jest.fn(),
    update: jest.fn(async () => ({ affected: 1 })),
  };
  return {
    __stubs: { managerStub, repositoryStub },
    AppDataSource: {
      getRepository: () => repositoryStub,
      transaction: async (work: (manager: unknown) => unknown) =>
        work(managerStub),
    },
  };
});

const { __stubs } = jest.requireMock("@/backend/datasource") as {
  __stubs: {
    managerStub: {
      delete: jest.Mock;
      create: jest.Mock;
      save: jest.Mock;
    };
    repositoryStub: {
      findOne: jest.Mock;
      update: jest.Mock;
    };
  };
};

const sampleData: RegisterCredentialData = {
  credentialId: "cred-abc123",
  credentialPublicKey: "cose-key-base64url",
  counter: 5,
  transports: ["internal", "hybrid"],
  deviceType: "singleDevice",
  backedUp: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("WebAuthnCredentialRepository", () => {
  describe("findByEmployeeId / findByCredentialId", () => {
    it("queries by employeeId and returns the row", async () => {
      const row = { id: "cred-1", employeeId: "emp-1" };
      __stubs.repositoryStub.findOne.mockResolvedValueOnce(row);

      await expect(
        webAuthnCredentialRepository.findByEmployeeId("emp-1")
      ).resolves.toBe(row);
      expect(__stubs.repositoryStub.findOne).toHaveBeenCalledWith({
        where: { employeeId: "emp-1" },
      });
    });

    it("returns null when no credential exists", async () => {
      __stubs.repositoryStub.findOne.mockResolvedValueOnce(null);

      await expect(
        webAuthnCredentialRepository.findByEmployeeId("emp-none")
      ).resolves.toBeNull();
    });

    it("queries by credentialId", async () => {
      __stubs.repositoryStub.findOne.mockResolvedValueOnce(null);

      await webAuthnCredentialRepository.findByCredentialId("cred-x");
      expect(__stubs.repositoryStub.findOne).toHaveBeenCalledWith({
        where: { credentialId: "cred-x" },
      });
    });
  });

  describe("replaceForEmployee", () => {
    it("deletes then inserts inside a single transaction", async () => {
      const saved = { ...sampleData, employeeId: "emp-1", id: "new-id" };
      __stubs.managerStub.save.mockResolvedValueOnce(saved);

      const result = await webAuthnCredentialRepository.replaceForEmployee(
        "emp-1",
        sampleData
      );

      expect(result).toBe(saved);
      expect(__stubs.managerStub.delete).toHaveBeenCalledWith(
        WebAuthnCredential,
        { employeeId: "emp-1" }
      );
      expect(__stubs.managerStub.create).toHaveBeenCalledWith(
        WebAuthnCredential,
        {
          employeeId: "emp-1",
          credentialId: sampleData.credentialId,
          credentialPublicKey: sampleData.credentialPublicKey,
          counter: sampleData.counter,
          transports: ["internal", "hybrid"],
          deviceType: sampleData.deviceType,
          backedUp: false,
          label: null,
        }
      );
      // Insert happens strictly after delete within the same transaction.
      expect(__stubs.managerStub.delete.mock.invocationCallOrder[0]).toBeLessThan(
        __stubs.managerStub.create.mock.invocationCallOrder[0]
      );
    });

    it("normalizes omitted optional fields to null on insert", async () => {
      const { label: _label, transports: _transports, ...minimal } = sampleData;
      await webAuthnCredentialRepository.replaceForEmployee("emp-2", minimal);

      const created = __stubs.managerStub.create.mock.calls[0][1];
      expect(created.transports).toBeNull();
      expect(created.label).toBeNull();
    });
  });

  describe("updateCounter", () => {
    it("updates only the counter column", async () => {
      await webAuthnCredentialRepository.updateCounter("cred-1", 42);
      expect(__stubs.repositoryStub.update).toHaveBeenCalledWith("cred-1", {
        counter: 42,
      });
    });
  });
});
