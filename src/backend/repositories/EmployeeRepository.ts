import { Repository } from "typeorm";
import { Employee } from "../models/Employee";
import { AppDataSource } from "../datasource";
import { CreateEmployeeDTO, UpdateEmployeeDTO } from "../types/employees";

class EmployeeRepository {
  private static instance: EmployeeRepository | null = null;
  private _repository: Repository<Employee> | null = null;

  private constructor() {}

  /** Lazy — resolves the TypeORM repository only after DataSource is initialized. */
  private get repository(): Repository<Employee> {
    if (!this._repository) {
      this._repository = AppDataSource.getRepository(Employee);
    }
    return this._repository;
  }

  public static getInstance(): EmployeeRepository {
    if (!EmployeeRepository.instance) {
      EmployeeRepository.instance = new EmployeeRepository();
    }
    return EmployeeRepository.instance;
  }

  public async findAll(): Promise<Employee[]> {
    return this.repository.find();
  }

  public async findById(id: string): Promise<Employee | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async findByAuthUserId(authUserId: string): Promise<Employee | null> {
    return this.repository.findOne({ where: { authUserId } });
  }

  public async findActive(): Promise<Employee[]> {
    return this.repository.find({ where: { active: true } });
  }

  public async create(data: CreateEmployeeDTO): Promise<Employee> {
    const employee = this.repository.create(data);
    return this.repository.save(employee);
  }

public async update(id: string, data: UpdateEmployeeDTO): Promise<Employee | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

public async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  public async updateIsWorking(id: string, isWorking: boolean): Promise<void> {
    await this.repository.update(id, { isWorking });
  }
}

export const employeeRepository = EmployeeRepository.getInstance();
