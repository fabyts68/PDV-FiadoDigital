import type { NextFunction, Request, Response } from "express";
import { StockMovementService } from "../services/stock-movement.service.js";

const stockMovementService = new StockMovementService();

export class StockMovementController {
  async listByProductId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await stockMovementService.listByProductId(req.params.productId as string);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.sub) {
        res.status(401).json({ success: false, message: "Não autenticado" });
        return;
      }

      const data = await stockMovementService.createAdjustment({
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
}
