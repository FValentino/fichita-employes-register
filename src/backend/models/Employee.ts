import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("employees")
export class Employee {
  @PrimaryColumn("uuid", { generated: "uuid" })
  id!: string;

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

  @Column({ default: false })
  isWorking!: boolean;

  @Column({ nullable: true })
  email!: string | null;

  @Column({ nullable: true })
  authUserId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}