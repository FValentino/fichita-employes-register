"use server";

import { employeeService } from "@/backend/services";
import { CreateEmployeeDTO, UpdateEmployeeDTO } from "@/backend/repositories";

export async function getEmployees() {
  try {
    const employees = await employeeService.getAll();
    return { success: true, data: employees };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getEmployee(id: number) {
  try {
    const employee = await employeeService.getById(id);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }
    return { success: true, data: employee };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveEmployees() {
  try {
    const employees = await employeeService.getActive();
    return { success: true, data: employees };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createEmployee(data: CreateEmployeeDTO) {
  try {
    const employee = await employeeService.create(data);
    return { success: true, data: employee };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateEmployee(id: number, data: UpdateEmployeeDTO) {
  try {
    const employee = await employeeService.update(id, data);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }
    return { success: true, data: employee };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteEmployee(id: number) {
  try {
    const deleted = await employeeService.delete(id);
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
