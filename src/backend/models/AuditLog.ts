import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  entity!: string; // "employee", "location", etc.

  @Column()
  entityId!: string;

  @Column()
  action!: string; // "update", "create", "delete"

  @Column({ nullable: true })
  performedBy!: string; // admin user ID or email

  @Column({ type: "jsonb", nullable: true })
  changes!: Record<string, { old: any; new: any }> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
