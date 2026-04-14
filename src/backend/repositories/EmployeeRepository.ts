import { Repository } from "typeorm";
import { Employee } from "../models";
import { AppDataSource } from "../datasource";

export interface CreateEmployeeDTO {
  name: string;
  active?: boolean;
}

export interface UpdateEmployeeDTO {
  name?: string;
  active?: boolean;
}

class EmployeeRepository {
  private static instance: EmployeeRepository | null = null;
  private repository: Repository<Employee>;

  private constructor() {
    this.repository = AppDataSource.getRepository(Employee);
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

  public async findById(id: number): Promise<Employee | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async findActive(): Promise<Employee[]> {
    return this.repository.find({ where: { active: true } });
  }

  public async create(data: CreateEmployeeDTO): Promise<Employee> {
    const employee = this.repository.create(data);
    return this.repository.save(employee);
  }

  public async update(id: number, data: UpdateEmployeeDTO): Promise<Employee | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  public async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

export const employeeRepository = EmployeeRepository.getInstance();
