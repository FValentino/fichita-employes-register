import { Repository } from "typeorm";
import { WebAuthnCredential } from "../models/WebAuthnCredential";
import { AppDataSource } from "../datasource";

/** Data captured from a successful registration ceremony. */
export interface RegisterCredentialData {
  credentialId: string;
  credentialPublicKey: string;
  counter: number;
  transports?: string[] | null;
  deviceType: string;
  backedUp: boolean;
  label?: string | null;
}

class WebAuthnCredentialRepository {
  private static instance: WebAuthnCredentialRepository | null = null;
  private repository: Repository<WebAuthnCredential>;

  private constructor() {
    this.repository = AppDataSource.getRepository(WebAuthnCredential);
  }

  public static getInstance(): WebAuthnCredentialRepository {
    if (!WebAuthnCredentialRepository.instance) {
      WebAuthnCredentialRepository.instance =
        new WebAuthnCredentialRepository();
    }
    return WebAuthnCredentialRepository.instance;
  }

  /** An employee owns at most one credential (unique employeeId). */
  public findByEmployeeId(
    employeeId: string
  ): Promise<WebAuthnCredential | null> {
    return this.repository.findOne({ where: { employeeId } });
  }

  /** Credential IDs are globally unique across all accounts. */
  public findByCredentialId(
    credentialId: string
  ): Promise<WebAuthnCredential | null> {
    return this.repository.findOne({ where: { credentialId } });
  }

  /**
   * Re-enrollment path: deletes any previous credential for the employee and
   * inserts the new one inside a single transaction. A failure mid-way keeps
   * the old credential intact, so the employee is never left without one.
   */
  public async replaceForEmployee(
    employeeId: string,
    data: RegisterCredentialData
  ): Promise<WebAuthnCredential> {
    return AppDataSource.transaction(async (manager) => {
      await manager.delete(WebAuthnCredential, { employeeId });

      const credential = manager.create(WebAuthnCredential, {
        employeeId,
        credentialId: data.credentialId,
        credentialPublicKey: data.credentialPublicKey,
        counter: data.counter,
        transports: data.transports ?? null,
        deviceType: data.deviceType,
        backedUp: data.backedUp,
        label: data.label ?? null,
      });
      return manager.save(credential);
    });
  }

  /**
   * Persists the authenticator signature counter after a successful
   * assertion. Monotonicity enforcement happens in WebAuthService.
   */
  public async updateCounter(id: string, counter: number): Promise<void> {
    await this.repository.update(id, { counter });
  }

  /**
   * Persists the new counter AND stamps lastUsedAt after a verified,
   * monotonic assertion. Counter-less authenticators keep reporting 0.
   */
  public async recordUsage(id: string, counter: number): Promise<void> {
    await this.repository.update(id, { counter, lastUsedAt: new Date() });
  }

  /**
   * Marks the credential revoked (counter regression / manual revoke).
   * A revoked credential must re-enroll before it can assert again.
   */
  public async markRevoked(id: string): Promise<void> {
    await this.repository.update(id, { revokedAt: new Date() });
  }
}

export const webAuthnCredentialRepository =
  WebAuthnCredentialRepository.getInstance();
