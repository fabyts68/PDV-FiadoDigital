import type { NextFunction, Request, Response } from "express";
import { PixService } from "../services/pix.service.js";

const pixService = new PixService();

export class PixController {
  async generateQRCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tx_id, amount_cents } = req.body as { tx_id?: string; amount_cents: number };
      const result = await pixService.generateQRCode(tx_id, amount_cents);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
