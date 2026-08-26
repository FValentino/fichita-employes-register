import { createHash, randomBytes } from "node:crypto";
import { IsNull, MoreThan, Repository } from "typeorm";
import {
  STEP_UP_INTENTS,
  type StepUpIntent,
  WebAuthnStepUpToken,
} from "../models/WebAuthnStepUpToken";
import { AppDataSource } from "../datasource";

const DEFAULT_TTL_SECONDS = 120;
/** 32 random bytes => 256-bit token, base64url-encoded (43 chars). */
const RAW_TOKEN_BYTES = 32;

function hashRawToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

class WebAuthnStepUpTokenRepository {
  private static instance: WebAuthnStepUpTokenRepository | null = null;
  private _repository: Repository<WebAuthnStepUpToken> | null = null;

  private constructor() {}

  /** Lazy — resolves the TypeORM repository only after DataSource is initialized. */
  private get repository(): Repository<WebAuthnStepUpToken> {
    if (!this._repository) {
      this._repository = AppDataSource.getRepository(WebAuthnStepUpToken);
    }
    return this._repository;
  }

  public static getInstance(): WebAuthnStepUpTokenRepository {
    if (!WebAuthnStepUpTokenRepository.instance) {
      WebAuthnStepUpTokenRepository.instance =
        new WebAuthnStepUpTokenRepository();
    }
    return WebAuthnStepUpTokenRepository.instance;
  }

  /**
   * Issues a single-use step-up token. Returns the RAW token exactly once —
   * only its SHA-256 hex digest is persisted, so a database leak cannot
   * replay attendance actions.
   */
  public async issue(
    employeeId: string,
    intent: StepUpIntent,
    ttlSeconds: number = DEFAULT_TTL_SECONDS
  ): Promise<string> {
    if (!STEP_UP_INTENTS.includes(intent)) {
      throw new Error(`Invalid step-up intent: ${intent}`);
    }

    const rawToken = randomBytes(RAW_TOKEN_BYTES).toString("base64url");
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const token = this.repository.create({
      tokenHash: hashRawToken(rawToken),
      employeeId,
      intent,
      expiresAt,
    });
    await this.repository.save(token);
    return rawToken;
  }

  /**
   * Atomically consumes a token. A single conditional UPDATE flips
   * `consumedAt` only when the row is unspent, unexpired, and bound to this
   * exact employee + intent. Concurrent consumers race on the same row and
   * only one UPDATE can match — the loser gets `null`.
   *
   * Returns the consumed token record on success, `null` when the token does
   * not exist, was already spent, expired, or belongs to another
   * employee/intent (indistinguishable on purpose).
   */
  public async consume(
    rawToken: string,
    employeeId: string,
    intent: StepUpIntent
  ): Promise<WebAuthnStepUpToken | null> {
    const tokenHash = hashRawToken(rawToken);

    const result = await this.repository.update(
      {
        tokenHash,
        employeeId,
        intent,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      { consumedAt: new Date() }
    );

    if ((result.affected ?? 0) === 0) {
      return null;
    }
    return this.repository.findOne({ where: { tokenHash } });
  }
}

export const webAuthnStepUpTokenRepository =
  WebAuthnStepUpTokenRepository.getInstance();
