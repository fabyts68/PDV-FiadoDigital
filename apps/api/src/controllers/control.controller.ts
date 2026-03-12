import type { NextFunction, Request, Response } from "express";
import { ControlService } from "../services/control.service.js";

const controlService = new ControlService();

function getStringQuery(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getNumberQuery(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

export class ControlController {
  async getStockSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await controlService.getStockSummary({
        product_type_id: getStringQuery(req.query.product_type_id),
        brand_id: getStringQuery(req.query.brand_id),
        page: getNumberQuery(req.query.page),
        per_page: getNumberQuery(req.query.per_page),
        sort_by: getStringQuery(req.query.sort_by) as "name" | "type" | "brand" | "stock" | "average_cost" | "stock_value" | undefined,
        sort_order: getStringQuery(req.query.sort_order) as "asc" | "desc" | undefined,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.productId as string;
      await controlService.ensureProductExists(productId);
      const data = await controlService.getStockMovements(productId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createStockAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.sub) {
        res.status(401).json({ success: false, message: "Não autenticado" });
        return;
      }

      const data = await controlService.createStockAdjustment({
        product_id: req.body.product_id as string,
        quantity: Number(req.body.quantity),
        unit_cost_cents: Number(req.body.unit_cost_cents),
        description: String(req.body.description ?? ""),
        operator_id: req.user.sub,
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCashSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await controlService.getCashSummary(
        getStringQuery(req.query.start_date),
        getStringQuery(req.query.end_date),
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getDiscountSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await controlService.getDiscountSummary(
        getStringQuery(req.query.start_date),
        getStringQuery(req.query.end_date),
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getCancellations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await controlService.getCancellations(
        getStringQuery(req.query.start_date),
        getStringQuery(req.query.end_date),
      );
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
