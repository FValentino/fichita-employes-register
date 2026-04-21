import { Employee } from "../models/Employee";
import { employeeRepository } from "../repositories/EmployeeRepository";
import { CreateEmployeeDTO, UpdateEmployeeDTO } from "../types/employees";

export class EmployeeService {
  private static instance: EmployeeService | null = null;

  private constructor() {}

  public static getInstance(): EmployeeService {
    if (!EmployeeService.instance) {
      EmployeeService.instance = new EmployeeService();
    }
    return EmployeeService.instance;
  }

  public async getAll(): Promise<Employee[]> {
    return employeeRepository.findAll();
  }

public async getById(id: string): Promise<Employee | null> {
    return employeeRepository.findById(id);
  }

  public async getActive(): Promise<Employee[]> {
    return employeeRepository.findActive();
  }

  public async create(data: CreateEmployeeDTO): Promise<Employee> {
    return employeeRepository.create(data);
  }

public async update(id: string, data: UpdateEmployeeDTO): Promise<Employee | null> {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new Error("Empleado no encontrado");
    }
    return employeeRepository.update(id, data);
  }

  public async delete(id: string): Promise<boolean> {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new Error("Empleado no encontrado");
    }
    return employeeRepository.delete(id);
  }
}

export const employeeService = EmployeeService.getInstance();
