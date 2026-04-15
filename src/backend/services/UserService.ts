import { User } from "../models";
import { userRepository, CreateUserDTO, UpdateUserDTO } from "../repositories";

export class UserService {
  private static instance: UserService | null = null;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  public async getAll(): Promise<User[]> {
    return userRepository.findAll();
  }

  public async getById(id: number): Promise<User | null> {
    return userRepository.findById(id);
  }

  public async getByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email);
  }

  public async create(data: CreateUserDTO): Promise<User> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error("El email ya está registrado");
    }
    return userRepository.create(data);
  }

  public async update(id: number, data: UpdateUserDTO): Promise<User | null> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        throw new Error("El email ya está registrado");
      }
    }
    return userRepository.update(id, data);
  }

  public async delete(id: number): Promise<boolean> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return userRepository.delete(id);
  }
}

export const userService = UserService.getInstance();
