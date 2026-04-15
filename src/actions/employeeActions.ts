"use server";

import { employeeService } from "@/backend/services";
import { CreateEmployeeDTO, UpdateEmployeeDTO } from "@/backend/repositories";

function toPlainEmployee(employee: any) {
  return {
    id: employee.id,
    name: employee.name,
    lastName: employee.lastName,
    hourlyRate: Number(employee.hourlyRate),
    weeklyHours: Number(employee.weeklyHours),
    active: employee.active,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

function formatEmployeeData(data: CreateEmployeeDTO | UpdateEmployeeDTO) {
  const capitalize = (str: string) => {
    const trimmed = str.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  return {
    ...data,
    name: capitalize(data.name),
    lastName: data.lastName.toUpperCase().trim(),
  };
}

export async function getEmployees() {
  try {
    const employees = await employeeService.getAll();
    const plainEmployees = employees.map(toPlainEmployee);
    plainEmployees.sort((a, b) => a.lastName.localeCompare(b.lastName));
    return { success: true, data: plainEmployees };
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
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveEmployees() {
  try {
    const employees = await employeeService.getActive();
    return { success: true, data: employees.map(toPlainEmployee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createEmployee(data: CreateEmployeeDTO) {
  try {
    const formattedData = formatEmployeeData(data);
    const employee = await employeeService.create(formattedData);
    return { success: true, data: toPlainEmployee(employee) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateEmployee(id: number, data: UpdateEmployeeDTO) {
  try {
    const formattedData = formatEmployeeData(data);
    const employee = await employeeService.update(id, formattedData);
    if (!employee) {
      return { success: false, error: "Empleado no encontrado" };
    }
    return { success: true, data: toPlainEmployee(employee) };
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
