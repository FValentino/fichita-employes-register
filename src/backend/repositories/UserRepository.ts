import { Repository } from "typeorm";
import { User, UserRole } from "../models";
import { AppDataSource } from "../datasource";

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

class UserRepository {
  private static instance: UserRepository | null = null;
  private repository: Repository<User>;

  private constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  public async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  public async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  public async create(data: CreateUserDTO): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  public async update(id: number, data: UpdateUserDTO): Promise<User | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  public async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

export const userRepository = UserRepository.getInstance();
