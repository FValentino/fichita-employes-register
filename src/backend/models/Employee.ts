import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Attendance } from "./Attendance";

@Entity("employees")
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  lastName!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  hourlyRate!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  weeklyHours!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances!: Attendance[];
}
