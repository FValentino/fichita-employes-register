import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee";

/** Intent a step-up token authorizes; maps to AttendanceType ENTRADA/SALIDA. */
export type StepUpIntent = "entry" | "exit";

export const STEP_UP_INTENTS = ["entry", "exit"] as const;

/**
 * Single-use opaque step-up token. Only the SHA-256 hex digest is stored;
 * consumption must be an atomic conditional update (see WebAuthService).
 */
@Entity("webauthn_step_up_tokens")
@Index("IDX_stepup_tokens_employee_created", ["employeeId", "createdAt"])
export class WebAuthnStepUpToken {
  @PrimaryColumn("uuid", { generated: "uuid" })
  id!: string;

  /** sha256 hex (64 chars) — the raw token is never persisted. */
  @Column({ type: "varchar", length: 64, unique: true })
  tokenHash!: string;

  @Column({ type: "uuid" })
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employeeId" })
  employee!: Employee;

  /** Which action this token admits ("entry" | "exit"). */
  @Column({ type: "varchar", length: 8 })
  intent!: StepUpIntent;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;

  /** Set by the atomic consume update; non-null means spent. */
  @Column({ type: "timestamptz", nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
