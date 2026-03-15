import type { NextFunction, Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service.js";

const VALID_PRESETS = ["today", "yesterday", "week", "month"] as const;
type PeriodPreset = typeof VALID_PRESETS[number];

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw = req.query["preset"];
      const preset: PeriodPreset =
        typeof raw === "string" && (VALID_PRESETS as readonly string[]).includes(raw)
          ? (raw as PeriodPreset)
          : "today";

      const data = await dashboardService.getSummary(preset);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
