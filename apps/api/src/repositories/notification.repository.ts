import { prisma } from "../config/database.js";
import type { Prisma } from "@prisma/client";
import type { CreateNotificationPayload } from "@pdv/shared";

export interface NotificationQueryParams {
  severity?: string;
  read?: boolean;
  search?: string;
  from_date?: Date;
  to_date?: Date;
  user_role?: string;
  page: number;
  per_page: number;
}

export interface NotificationExportParams {
  severity?: string;
  from_date?: Date;
  to_date?: Date;
  user_role?: string;
}

export class NotificationRepository {
  async create(payload: Omit<CreateNotificationPayload, "target_roles"> & { target_roles: string }) {
    return prisma.notification.create({
      data: {
        type: payload.type,
        severity: payload.severity,
        title: payload.title,
        message: payload.message,
        meta: payload.meta ?? null,
        target_roles: payload.target_roles,
      },
    });
  }

  async findAll(params: NotificationQueryParams) {
    const where: Prisma.NotificationWhereInput = {
      ...(params.user_role ? { target_roles: { contains: `"${params.user_role}"` } } : {}),
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.read === true ? { read_at: { not: null } } : {}),
      ...(params.read === false ? { read_at: null } : {}),
      ...(params.search
        ? { OR: [{ title: { contains: params.search } }, { message: { contains: params.search } }] }
        : {}),
      ...(params.from_date || params.to_date
        ? {
            created_at: {
              ...(params.from_date ? { gte: params.from_date } : {}),
              ...(params.to_date ? { lte: params.to_date } : {}),
            },
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: params.per_page,
        skip: (params.page - 1) * params.per_page,
      }),
    ]);

    return {
      data,
      pagination: {
        page: params.page,
        per_page: params.per_page,
        total,
        total_pages: Math.ceil(total / params.per_page),
      },
    };
  }

  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read_at: new Date() },
    });
  }

  async markAllRead(userRole?: string) {
    return prisma.notification.updateMany({
      where: {
        read_at: null,
        ...(userRole ? { target_roles: { contains: `"${userRole}"` } } : {}),
      },
      data: { read_at: new Date() },
    });
  }

  async acknowledge(id: string, userId: string) {
    return prisma.notification.update({
      where: { id },
      data: { acknowledged_by: userId },
    });
  }

  async countUnread(userRole?: string) {
    return prisma.notification.count({
      where: {
        read_at: null,
        ...(userRole ? { target_roles: { contains: `"${userRole}"` } } : {}),
      },
    });
  }

  async findForExport(params: NotificationExportParams) {
    return prisma.notification.findMany({
      where: {
        ...(params.user_role ? { target_roles: { contains: `"${params.user_role}"` } } : {}),
        ...(params.severity ? { severity: params.severity } : {}),
        ...(params.from_date || params.to_date
          ? {
              created_at: {
                ...(params.from_date ? { gte: params.from_date } : {}),
                ...(params.to_date ? { lte: params.to_date } : {}),
              },
            }
          : {}),
      },
      orderBy: { created_at: "desc" },
    });
  }
}
