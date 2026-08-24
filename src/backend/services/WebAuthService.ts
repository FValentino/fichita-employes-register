import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { Employee } from "../models/Employee";
import { WebAuthnCredential } from "../models/WebAuthnCredential";
import type { StepUpIntent } from "../models/WebAuthnStepUpToken";
import { webAuthnCredentialRepository } from "../repositories/WebAuthnCredentialRepository";
import { webAuthnStepUpTokenRepository } from "../repositories/WebAuthnStepUpTokenRepository";
import { getWebAuthnConfig } from "@/lib/webauthn/config";
import { auditLogService } from "./AuditLogService";

/**
 * WebAuthn step-up ceremonies (enrollment + assertion).
 *
 * Challenges are NOT persisted here: `startRegistration` / `startAssertion`
 * return the generated options and the API route seals `options.challenge`
 * inside the HMAC-signed state cookie. The route later hands the expected
 * challenge back to the matching `finish*` method.
 */

/** WEBAUTHN_* env vars are missing/invalid — routes respond 503 config_missing. */
export class WebAuthnConfigMissingError extends Error {
  constructor() {
    super("WebAuthn is not configured");
    this.name = "WebAuthnConfigMissingError";
  }
}

/** Employee has no credential row yet — routes respond 404 not_enrolled. */
export class WebAuthnNotEnrolledError extends Error {
  constructor() {
    super("No credential enrolled for this employee");
    this.name = "WebAuthnNotEnrolledError";
  }
}

/** Credential was revoked (counter regression) — routes respond 410. */
export class WebAuthnCredentialRevokedError extends Error {
  constructor() {
    super("Credential revoked, re-enrollment required");
    this.name = "WebAuthnCredentialRevokedError";
  }
}

/** Authenticator already bound to a different account — routes respond 409. */
export class WebAuthnCredentialTakenError extends Error {
  constructor() {
    super("Credential is already registered to another account");
    this.name = "WebAuthnCredentialTakenError";
  }
}

/** Signature/challenge/UV verification failed — routes respond 400 generic. */
export class WebAuthnVerificationFailedError extends Error {
  constructor(message: string = "Ceremony could not be verified") {
    super(message);
    this.name = "WebAuthnVerificationFailedError";
  }
}

/**
 * Signature counter went backwards or stayed flat — probable cloned
 * authenticator. Credential gets revoked; routes respond 400.
 */
export class WebAuthnCounterRegressionError extends Error {
  constructor() {
    super("Authenticator counter regression detected");
    this.name = "WebAuthnCounterRegressionError";
  }
}

const toTransports = (
  transports: string[] | null | undefined
): AuthenticatorTransportFuture[] | undefined =>
  (transports ?? undefined) as AuthenticatorTransportFuture[] | undefined;

export class WebAuthService {
  private static instance: WebAuthService | null = null;

  private constructor() {}

  public static getInstance(): WebAuthService {
    if (!WebAuthService.instance) {
      WebAuthService.instance = new WebAuthService();
    }
    return WebAuthService.instance;
  }

  /**
   * Builds the browser's credential-creation options for enrollment.
   * The challenge travels back inside the options; the route must seal it
   * in the state cookie before responding.
   */
  public async startRegistration(
    employee: Employee
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const config = this.requireConfig();
    if (!employee.email) {
      throw new Error("Employee has no email to bind the credential to");
    }

    const existing =
      await webAuthnCredentialRepository.findByEmployeeId(employee.id);
    // Only an ACTIVE credential excludes the authenticator: after a revoke
    // the same device must be able to re-enroll.
    const excludeCredentials =
      existing && !existing.revokedAt
        ? [
            {
              id: existing.credentialId,
              transports: toTransports(existing.transports),
            },
          ]
        : [];

    return generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userName: employee.email,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
      },
    });
  }

  /**
   * Verifies the attestation response and persists the credential.
   * Re-enrollment replaces any previous row atomically; a credential ID
   * already bound to ANOTHER account aborts with nothing stored.
   */
  public async finishRegistration(
    employeeId: string,
    response: RegistrationResponseJSON,
    expectedChallenge: string
  ): Promise<WebAuthnCredential> {
    const config = this.requireConfig();

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.expectedOrigin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new WebAuthnVerificationFailedError(
        "Registration could not be verified"
      );
    }

    const info = verification.registrationInfo;
    const credentialId = info.credential.id;

    // Credential IDs are globally unique — one authenticator, one account.
    const collision =
      await webAuthnCredentialRepository.findByCredentialId(credentialId);
    if (collision && collision.employeeId !== employeeId) {
      await this.audit("credential_taken", employeeId);
      throw new WebAuthnCredentialTakenError();
    }

    const credential = await webAuthnCredentialRepository.replaceForEmployee(
      employeeId,
      {
        credentialId,
        // SWA v13 returns raw COSE bytes; the column stores base64url text.
        credentialPublicKey: Buffer.from(
          info.credential.publicKey
        ).toString("base64url"),
        counter: info.credential.counter,
        transports: info.credential.transports ?? null,
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
      }
    );

    await this.audit("enroll", employeeId);
    return credential;
  }

  /**
   * Builds the browser's assertion options for step-up verification.
   * Only the employee's own stored credential may answer the prompt.
   */
  public async startAssertion(
    employeeId: string
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const config = this.requireConfig();
    const credential = await this.requireActiveCredential(employeeId);

    return generateAuthenticationOptions({
      rpID: config.rpID,
      allowCredentials: [
        {
          id: credential.credentialId,
          transports: toTransports(credential.transports),
        },
      ],
      userVerification: "required",
    });
  }

  /**
   * Verifies the assertion against the stored public key, enforces counter
   * monotonicity (clone detection), then issues a single-use raw step-up
   * token bound to this employee + intent.
   */
  public async finishAssertion(
    employeeId: string,
    response: AuthenticationResponseJSON,
    expectedChallenge: string,
    intent: StepUpIntent
  ): Promise<string> {
    const config = this.requireConfig();
    const credential = await this.requireActiveCredential(employeeId);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: config.expectedOrigin,
      expectedRPID: config.rpID,
      requireUserVerification: true,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(
          Buffer.from(credential.credentialPublicKey, "base64url")
        ),
        counter: credential.counter,
        transports: toTransports(credential.transports),
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      await this.audit("assert_failed", employeeId);
      throw new WebAuthnVerificationFailedError(
        "Assertion could not be verified"
      );
    }

    const { newCounter } = verification.authenticationInfo;

    // Clone detection: counters must grow monotonically. Counter-less
    // authenticators always report 0, hence the `stored > 0` exemption.
    if (credential.counter > 0 && newCounter <= credential.counter) {
      await webAuthnCredentialRepository.markRevoked(credential.id);
      await this.audit("counter_regression", employeeId);
      throw new WebAuthnCounterRegressionError();
    }

    await webAuthnCredentialRepository.recordUsage(credential.id, newCounter);
    const stepUpToken = await webAuthnStepUpTokenRepository.issue(
      employeeId,
      intent
    );
    await this.audit("assert_success", credential.id);

    return stepUpToken;
  }

  private requireConfig() {
    const config = getWebAuthnConfig();
    if (!config) {
      throw new WebAuthnConfigMissingError();
    }
    return config;
  }

  /** Loads the employee's credential, rejecting missing/revoked rows. */
  private async requireActiveCredential(employeeId: string) {
    const credential =
      await webAuthnCredentialRepository.findByEmployeeId(employeeId);
    if (!credential) {
      throw new WebAuthnNotEnrolledError();
    }
    if (credential.revokedAt) {
      throw new WebAuthnCredentialRevokedError();
    }
    return credential;
  }

  /** Security events must reach the audit trail but never break a ceremony. */
  private async audit(action: string, entityId: string): Promise<void> {
    try {
      await auditLogService.log({
        entity: "webauthn_credential",
        entityId,
        action,
      });
    } catch {
      // Audit persistence failures must not fail the ceremony itself.
    }
  }
}

export const webAuthService = WebAuthService.getInstance();
