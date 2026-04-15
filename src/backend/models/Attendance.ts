import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Employee } from "./Employee";
import { User } from "./User";

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

  @Column()
  recorded_by: number;

  @Column({
    type: "enum",
    enum: AttendanceType,
  })
  type: AttendanceType;

  @Column({ type: "datetime" })
  timestamp: Date;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  @JoinColumn({ name: "employee_id" })
  employee: Employee;

  @ManyToOne(() => User, (user) => user.attendances)
  @JoinColumn({ name: "recorded_by" })
  recordedBy: User;
}
