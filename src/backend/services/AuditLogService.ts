import { AuditLog } from "../models/AuditLog";
import { auditLogRepository } from "../repositories/AuditLogRepository";

export class AuditLogService {
  private static instance: AuditLogService | null = null;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  public async log(data: {
    entity: string;
    entityId: string;
    action: string;
    performedBy?: string;
    changes?: Record<string, { old: any; new: any }>;
  }): Promise<AuditLog> {
    return auditLogRepository.create(data);
  }

  public async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return auditLogRepository.findByEntity(entity, entityId);
  }

  public async findAll(limit?: number): Promise<AuditLog[]> {
    return auditLogRepository.findAll(limit);
  }
}

export const auditLogService = AuditLogService.getInstance();
