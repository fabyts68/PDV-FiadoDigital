import {
  NotificationRepository,
  type NotificationQueryParams,
  type NotificationExportParams,
} from "../repositories/notification.repository.js";
import { broadcast } from "../websocket/index.js";
import type { CreateNotificationPayload } from "@pdv/shared";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  async create(payload: CreateNotificationPayload) {
    const notification = await notificationRepository.create({
      ...payload,
      target_roles: JSON.stringify(payload.target_roles),
    });

    broadcast({ type: "notification.new", payload: notification });

    return notification;
  }

  async list(params: NotificationQueryParams) {
    return notificationRepository.findAll(params);
  }

  async markAsRead(id: string) {
    const notification = await notificationRepository.findById(id);

    if (!notification) {
      throw new Error("Notificação não encontrada");
    }

    return notificationRepository.markAsRead(id);
  }

  async markAllRead(userRole?: string) {
    return notificationRepository.markAllRead(userRole);
  }

  async acknowledge(id: string, userId: string) {
    const notification = await notificationRepository.findById(id);

    if (!notification) {
      throw new Error("Notificação não encontrada");
    }

    return notificationRepository.acknowledge(id, userId);
  }

  async getUnreadCount(userRole?: string) {
    const count = await notificationRepository.countUnread(userRole);
    return { count };
  }

  async exportCsv(params: NotificationExportParams): Promise<string> {
    const notifications = await notificationRepository.findForExport(params);

    const header = "id,type,severity,title,message,created_at,read_at,acknowledged_by\n";
    const rows = notifications
      .map((n) =>
        [
          n.id,
          n.type,
          n.severity,
          `"${n.title.replace(/"/g, '""')}"`,
          `"${n.message.replace(/"/g, '""')}"`,
          n.created_at.toISOString(),
          n.read_at?.toISOString() ?? "",
          n.acknowledged_by ?? "",
        ].join(","),
      )
      .join("\n");

    return header + rows;
  }
}
