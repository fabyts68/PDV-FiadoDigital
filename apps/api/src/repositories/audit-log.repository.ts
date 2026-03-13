import { prisma } from "../config/database.js";

type CreateAuditLogData = {
  action: string;
  actor_id: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  terminal_id?: string;
};

export class AuditLogRepository {
  async create(data: CreateAuditLogData): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        actor_id: data.actor_id,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        details: data.details ? JSON.stringify(data.details) : null,
        ip_address: data.ip_address ?? null,
        terminal_id: data.terminal_id ?? null,
      },
    });
  }
}
