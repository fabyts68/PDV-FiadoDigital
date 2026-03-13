import type { Request, Response, NextFunction } from "express";
import { SaleService } from "../services/sale.service.js";

const saleService = new SaleService();

export class SaleController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = typeof req.query.page === "number" ? req.query.page : 1;
      const perPage = typeof req.query.per_page === "number" ? req.query.per_page : 20;
      const fromDate = req.query.from_date instanceof Date ? req.query.from_date : undefined;
      const toDate = req.query.to_date instanceof Date ? req.query.to_date : undefined;
      const status =
        typeof req.query.status === "string"
          ? (req.query.status as "completed" | "cancelled" | "refunded")
          : undefined;
      const terminalId =
        typeof req.query.terminal_id === "string" ? req.query.terminal_id : undefined;
      const operatorId =
        typeof req.query.operator_id === "string" ? req.query.operator_id : undefined;

      const result = await saleService.list({
        page,
        per_page: perPage,
        from_date: fromDate,
        to_date: toDate,
        status,
        terminal_id: terminalId,
        operator_id: operatorId,
      });

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sale = await saleService.getById(req.params.id as string);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sale = await saleService.create(req.body);
      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  async cancel(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { manager_pin } = req.body as { manager_pin: string };
      const operatorId = req.user?.sub as string;
      await saleService.cancel(req.params.id as string, manager_pin, operatorId);
      res.json({ success: true, message: "Venda cancelada" });
    } catch (error) {
      next(error);
    }
  }

  async refund(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { manager_pin } = req.body as { manager_pin: string };
      const operatorId = req.user?.sub as string;
      await saleService.refund(req.params.id as string, manager_pin, operatorId);
      res.json({ success: true, message: "Estorno realizado" });
    } catch (error) {
      next(error);
    }
  }
}
