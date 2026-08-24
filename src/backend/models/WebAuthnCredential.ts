import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee";

/**
 * One platform credential per employee (unique employeeId).
 * Re-enrollment replaces the row atomically (delete + insert in one transaction).
 */
@Entity("webauthn_credentials")
export class WebAuthnCredential {
  @PrimaryColumn("uuid", { generated: "uuid" })
  id!: string;

  /** Owner of this credential — unique so an employee has at most one. */
  @Column({ type: "uuid", unique: true })
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employeeId" })
  employee!: Employee;

  /** base64url credential ID — globally unique across all accounts. */
  @Column({ type: "varchar", length: 512, unique: true })
  credentialId!: string;

  /** base64url-encoded COSE public key returned by the registration ceremony. */
  @Column({ type: "text" })
  credentialPublicKey!: string;

  /**
   * Authenticator signature counter. Monotonicity is enforced at assertion
   * time (regression => revoke), not at the schema level.
   */
  @Column({
    type: "bigint",
    default: 0,
    transformer: {
      to: (value?: number | null): string | undefined =>
        value == null ? undefined : String(value),
      from: (value?: string | number | null): number =>
        value == null ? 0 : Number(value),
    },
  })
  counter!: number;

  /** Transports reported at registration (e.g. "internal", "hybrid"). */
  @Column({ type: "jsonb", nullable: true })
  transports!: string[] | null;

  /** "singleDevice" | "multiDevice" (app-level validation; no DB check constraint). */
  @Column({ type: "varchar", length: 16 })
  deviceType!: string;

  @Column({ default: false })
  backedUp!: boolean;

  /** Optional device label shown in future settings UIs. */
  @Column({ type: "varchar", length: 64, nullable: true })
  label!: string | null;

  /** Set on counter regression or manual revoke; revoked credentials must re-enroll. */
  @Column({ type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  /** Last successful step-up assertion with this credential. */
  @Column({ type: "timestamptz", nullable: true })
  lastUsedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
