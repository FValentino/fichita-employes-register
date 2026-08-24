import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Employee } from "./Employee";

@Entity("employee_turns")
export class EmployeeTurn {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid" })
  employeeId!: string;

  @ManyToOne(() => Employee, { onDelete: "CASCADE" })
  @JoinColumn({ name: "employeeId" })
  employee!: Employee;

  @Column({ type: "int" })
  dayOfWeek!: number; // 0=Monday, 6=Sunday

  @Column({ type: "time", nullable: true })
  entryTime!: string | null; // "09:00"

  @Column({ type: "time", nullable: true })
  exitTime!: string | null; // "17:00"

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
