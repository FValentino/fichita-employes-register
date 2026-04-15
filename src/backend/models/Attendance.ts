import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

export enum AttendanceType {
  ENTRADA = "ENTRADA",
  SALIDA = "SALIDA",
}

@Entity("attendance")
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employee_id: number;

  @Column({ nullable: true })
  recorded_by: number | null;

  @Column({
    type: "enum",
    enum: AttendanceType,
  })
  type: AttendanceType;

  @Column({ type: "timestamptz" })
  timestamp: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne("Employee", "attendances")
  @JoinColumn({ name: "employee_id" })
  employee: any;

  @ManyToOne("User", "attendances", { nullable: true })
  @JoinColumn({ name: "recorded_by" })
  recordedBy: any;
}
