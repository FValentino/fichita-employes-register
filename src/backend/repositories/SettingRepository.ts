import { Repository } from "typeorm";
import { Setting } from "../models/Setting";
import { AppDataSource } from "../datasource";

class SettingRepository {
  private static instance: SettingRepository | null = null;
  private _repository: Repository<Setting> | null = null;

  private constructor() {}

  /** Lazy — resolves the TypeORM repository only after DataSource is initialized. */
  private get repository(): Repository<Setting> {
    if (!this._repository) {
      this._repository = AppDataSource.getRepository(Setting);
    }
    return this._repository;
  }

  public static getInstance(): SettingRepository {
    if (!SettingRepository.instance) {
      SettingRepository.instance = new SettingRepository();
    }
    return SettingRepository.instance;
  }

  public async getValue(key: string): Promise<string | null> {
    const setting = await this.repository.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  public async setValue(key: string, value: string, description?: string): Promise<void> {
    const existing = await this.repository.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      if (description !== undefined) {
        existing.description = description;
      }
      await this.repository.save(existing);
    } else {
      const entity = new Setting();
      entity.key = key;
      entity.value = value;
      if (description !== undefined) {
        entity.description = description;
      }
      await this.repository.save(entity);
    }
  }

  public async getAll(): Promise<Setting[]> {
    return this.repository.find({ order: { key: "ASC" } });
  }

  public async delete(key: string): Promise<boolean> {
    const result = await this.repository.delete({ key });
    return (result.affected ?? 0) > 0;
  }
}

export const settingRepository = SettingRepository.getInstance();
