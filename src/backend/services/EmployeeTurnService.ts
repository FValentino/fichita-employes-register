import { EmployeeTurn } from "../models/EmployeeTurn";
import { employeeTurnRepository } from "../repositories/EmployeeTurnRepository";
import { CreateEmployeeTurnDTO, UpdateEmployeeTurnDTO, BulkCreateTurnsDTO } from "../types/employeeTurns";

export class EmployeeTurnService {
  private static instance: EmployeeTurnService | null = null;

  private constructor() {}

  public static getInstance(): EmployeeTurnService {
    if (!EmployeeTurnService.instance) {
      EmployeeTurnService.instance = new EmployeeTurnService();
    }
    return EmployeeTurnService.instance;
  }

  public async getByEmployee(employeeId: string): Promise<EmployeeTurn[]> {
    return employeeTurnRepository.findByEmployee(employeeId);
  }

  public async getByEmployeeAndDay(employeeId: string, dayOfWeek: number): Promise<EmployeeTurn | null> {
    return employeeTurnRepository.findByEmployeeAndDay(employeeId, dayOfWeek);
  }

  public async create(data: CreateEmployeeTurnDTO): Promise<EmployeeTurn> {
    return employeeTurnRepository.create(data);
  }

  public async update(id: number, data: UpdateEmployeeTurnDTO): Promise<EmployeeTurn | null> {
    return employeeTurnRepository.update(id, data);
  }

  public async delete(id: number): Promise<boolean> {
    return employeeTurnRepository.delete(id);
  }

  public async bulkUpsert(data: BulkCreateTurnsDTO): Promise<void> {
    return employeeTurnRepository.bulkUpsert(data.employeeId, data.turns);
  }

  public async hasTurnsForEmployee(employeeId: string): Promise<boolean> {
    const turns = await employeeTurnRepository.findByEmployee(employeeId);
    return turns.length > 0;
  }
}

export const employeeTurnService = EmployeeTurnService.getInstance();
