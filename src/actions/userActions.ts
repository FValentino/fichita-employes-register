"use server";

import { userService } from "@/backend/services";
import { CreateUserDTO, UpdateUserDTO } from "@/backend/repositories";

export async function getUsers() {
  try {
    const users = await userService.getAll();
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getUser(id: number) {
  try {
    const user = await userService.getById(id);
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createUser(data: CreateUserDTO) {
  try {
    const user = await userService.create(data);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateUser(id: number, data: UpdateUserDTO) {
  try {
    const user = await userService.update(id, data);
    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteUser(id: number) {
  try {
    const deleted = await userService.delete(id);
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
