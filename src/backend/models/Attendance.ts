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

  @CreateDateColumn()
  created_at!: Date;
}