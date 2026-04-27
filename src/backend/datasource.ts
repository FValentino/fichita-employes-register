import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./models/Employee";
import { Attendance } from "./models/Attendance";
import * as dotenv from "dotenv";

dotenv.config();

class Database {
  private static instance: Database | null = null;
  private dataSource: DataSource;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      synchronize: true,
      logging: false,
      entities: [Employee, Attendance],
      migrations: [],
      subscribers: [],
      extra: {
        options: "-c timezone=America/Argentina/Buenos_Aires",
      },
    });
    this.initPromise = this.initialize();
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

  public async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }
}

const dbInstance = Database.getInstance();

export const AppDataSource = dbInstance.getDataSource();
export const db = dbInstance;
export const waitForDb = () => dbInstance.waitForInit();
