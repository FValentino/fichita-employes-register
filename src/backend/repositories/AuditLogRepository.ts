import { Repository } from "typeorm";
import { AuditLog } from "../models/AuditLog";
import { AppDataSource } from "../datasource";

class AuditLogRepository {
  private static instance: AuditLogRepository | null = null;
  private _repository: Repository<AuditLog> | null = null;

  private constructor() {}

  /** Lazy — resolves the TypeORM repository only after DataSource is initialized. */
  private get repository(): Repository<AuditLog> {
    if (!this._repository) {
      this._repository = AppDataSource.getRepository(AuditLog);
    }
    return this._repository;
  }

  public static getInstance(): AuditLogRepository {
    if (!AuditLogRepository.instance) {
      AuditLogRepository.instance = new AuditLogRepository();
    }
    return AuditLogRepository.instance;
  }

  public async create(data: {
    entity: string;
    entityId: string;
    action: string;
    performedBy?: string;
    changes?: Record<string, { old: any; new: any }>;
  }): Promise<AuditLog> {
    const entity = new AuditLog();
    entity.entity = data.entity;
    entity.entityId = data.entityId;
    entity.action = data.action;
    if (data.performedBy) {
      entity.performedBy = data.performedBy;
    }
    if (data.changes) {
      entity.changes = data.changes;
    }
    return this.repository.save(entity);
  }

  public async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return this.repository.find({
      where: { entity, entityId },
      order: { createdAt: "DESC" },
    });
  }

  public async findAll(limit: number = 100): Promise<AuditLog[]> {
    return this.repository.find({
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}

export const auditLogRepository = AuditLogRepository.getInstance();
