import { Repository } from "typeorm";
import { EmployeeTurn } from "../models/EmployeeTurn";
import { AppDataSource } from "../datasource";
import { CreateEmployeeTurnDTO, UpdateEmployeeTurnDTO } from "../types/employeeTurns";

class EmployeeTurnRepository {
  private static instance: EmployeeTurnRepository | null = null;
  private repository: Repository<EmployeeTurn>;

  private constructor() {
    this.repository = AppDataSource.getRepository(EmployeeTurn);
  }

  public static getInstance(): EmployeeTurnRepository {
    if (!EmployeeTurnRepository.instance) {
      EmployeeTurnRepository.instance = new EmployeeTurnRepository();
    }
    return EmployeeTurnRepository.instance;
  }

  public async findByEmployee(employeeId: string): Promise<EmployeeTurn[]> {
    return this.repository.find({
      where: { employeeId },
      order: { dayOfWeek: "ASC" },
    });
  }

  public async findByEmployeeAndDay(employeeId: string, dayOfWeek: number): Promise<EmployeeTurn | null> {
    return this.repository.findOne({
      where: { employeeId, dayOfWeek },
    });
  }

  public async create(data: CreateEmployeeTurnDTO): Promise<EmployeeTurn> {
    const turn = this.repository.create(data);
    return this.repository.save(turn);
  }

  public async update(id: number, data: UpdateEmployeeTurnDTO): Promise<EmployeeTurn | null> {
    await this.repository.update(id, data);
    return this.repository.findOne({ where: { id } });
  }

  public async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  public async deleteByEmployee(employeeId: string): Promise<boolean> {
    const result = await this.repository.delete({ employeeId });
    return (result.affected ?? 0) > 0;
  }

  public async bulkUpsert(employeeId: string, turns: Array<{ dayOfWeek: number; entryTime: string | null; exitTime: string | null }>): Promise<void> {
    // Delete existing turns for this employee
    await this.repository.delete({ employeeId });

    // Insert new turns
    if (turns.length > 0) {
      const entities = turns.map((t) =>
        this.repository.create({
          employeeId,
          dayOfWeek: t.dayOfWeek,
          entryTime: t.entryTime,
          exitTime: t.exitTime,
          active: true,
        })
      );
      await this.repository.save(entities);
    }
  }
}

export const employeeTurnRepository = EmployeeTurnRepository.getInstance();
