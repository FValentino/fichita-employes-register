import { Setting } from "../models/Setting";
import { settingRepository } from "../repositories/SettingRepository";

export class SettingService {
  private static instance: SettingService | null = null;

  private constructor() {}

  public static getInstance(): SettingService {
    if (!SettingService.instance) {
      SettingService.instance = new SettingService();
    }
    return SettingService.instance;
  }

  public async get(key: string): Promise<string | null> {
    return settingRepository.getValue(key);
  }

  public async set(key: string, value: string, description?: string): Promise<void> {
    return settingRepository.setValue(key, value, description);
  }

  public async getAll(): Promise<Setting[]> {
    return settingRepository.getAll();
  }

  public async getBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    return value === "true";
  }

  public async setBoolean(key: string, value: boolean, description?: string): Promise<void> {
    return this.set(key, value ? "true" : "false", description);
  }
}

export const settingService = SettingService.getInstance();
