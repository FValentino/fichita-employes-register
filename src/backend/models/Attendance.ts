import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum AttendanceType {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
}

@Entity("attendance")
export class Attendance {
  @PrimaryColumn("uuid", { generated: "uuid" })
  id!: string;

  @Column("uuid")
  employeeId!: string;

  @Column({
    type: "enum",
    enum: AttendanceType,
  })
  type!: AttendanceType;

  @Column({ type: "timestamptz" })
  timestamp!: Date;

  @Column({ type: "jsonb", nullable: true })
  deviceInfo!: {
    fingerprint?: string;
    userAgent?: string;
    verificationMethod?: "biometric" | "password";
  } | null;

  @CreateDateColumn()
  created_at!: Date;
}