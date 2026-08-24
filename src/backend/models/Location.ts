import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("locations")
export class Location {
  @PrimaryColumn("uuid", { generated: "uuid" })
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  lat!: number | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  lng!: number | null;

  @Column({ type: "int", default: 100 })
  radiusMeters!: number;

  @Column({ nullable: true })
  address!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
