import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./models/User";
import { Employee } from "./models/Employee";
import { Attendance } from "./models/Attendance";
import * as dotenv from "dotenv";

dotenv.config();

class Database {
  private static instance: Database | null = null;
  private dataSource: DataSource;

  private constructor() {
    this.dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: true,
      logging: false,
      entities: [User, Employee, Attendance],
      migrations: [],
      subscribers: [],
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getDataSource(): DataSource {
    return this.dataSource;
  }

  public async initialize(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }
}

const dbInstance = Database.getInstance();
dbInstance.initialize();

export const AppDataSource = dbInstance.getDataSource();
export const db = dbInstance;
