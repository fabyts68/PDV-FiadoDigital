import type { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service.js";
import type { NotificationQueryParams } from "../repositories/notification.repository.js";

const notificationService = new NotificationService();

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as Record<string, unknown>;

      const params: NotificationQueryParams = {
        page: typeof query.page === "number" ? query.page : 1,
        per_page: typeof query.per_page === "number" ? query.per_page : 20,
        severity: typeof query.severity === "string" ? query.severity : undefined,
        user_role: req.user?.role,
        read:
          query.read === true || query.read === false
            ? (query.read as boolean)
            : undefined,
        search: typeof query.search === "string" ? query.search : undefined,
        from_date: query.from_date instanceof Date ? query.from_date : undefined,
        to_date: query.to_date instanceof Date ? query.to_date : undefined,
      };

      const result = await notificationService.list(params);

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notification = await notificationService.markAsRead(req.params.id as string);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async acknowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.sub as string;
      const notification = await notificationService.acknowledge(req.params.id as string, userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllRead(req.user?.role);
      res.json({ success: true, message: "Todas as notificações foram marcadas como lidas" });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notificationService.getUnreadCount(req.user?.role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as Record<string, unknown>;

      const csv = await notificationService.exportCsv({
        severity: typeof query.severity === "string" ? query.severity : undefined,
        from_date: query.from_date instanceof Date ? query.from_date : undefined,
        to_date: query.to_date instanceof Date ? query.to_date : undefined,
        user_role: req.user?.role,
      });

      const filename = `notificacoes-${new Date().toISOString().split("T")[0]}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}
