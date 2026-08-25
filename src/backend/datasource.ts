import "reflect-metadata";
import { DataSource } from "typeorm";
import { Employee } from "./models/Employee";
import { Attendance } from "./models/Attendance";
import { Location } from "./models/Location";
import { EmployeeTurn } from "./models/EmployeeTurn";
import { Setting } from "./models/Setting";
import { AuditLog } from "./models/AuditLog";
import { WebAuthnCredential } from "./models/WebAuthnCredential";
import { WebAuthnStepUpToken } from "./models/WebAuthnStepUpToken";
import * as dotenv from "dotenv";

dotenv.config();

class Database {
  private static instance: Database | null = null;
  private dataSource: DataSource;
  private initPromise: Promise<void> | null = null;
  private initFailed = false;

  private constructor() {
    this.dataSource = new DataSource({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      synchronize: process.env.NODE_ENV !== "production",
      logging: false,
      entities: [
        Employee,
        Attendance,
        Location,
        EmployeeTurn,
        Setting,
        AuditLog,
        WebAuthnCredential,
        WebAuthnStepUpToken,
      ],
      migrations: [],
      subscribers: [],
      extra: {
        options: "-c timezone=America/Argentina/Buenos_Aires",
      },
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
    if (this.dataSource.isInitialized) {
      this.initFailed = false;
      return;
    }
    await this.dataSource.initialize();
  }

  public async waitForInit(): Promise<void> {
    // If previous init failed or never started, retry
    if (this.initFailed || !this.initPromise) {
      this.initPromise = this.initialize().catch((err) => {
        this.initFailed = true;
        throw err;
      });
    }
    await this.initPromise;
  }
}

const dbInstance = Database.getInstance();

export const AppDataSource = dbInstance.getDataSource();
export const db = dbInstance;
export const waitForDb = () => dbInstance.waitForInit();
