import type { DashboardSummary } from "@pdv/shared";
import { DashboardRepository } from "../repositories/dashboard.repository.js";

export type PeriodPreset = "today" | "yesterday" | "week" | "month";

const dashboardRepository = new DashboardRepository();

export class DashboardService {
  async getSummary(preset: PeriodPreset = "today"): Promise<DashboardSummary> {
    return dashboardRepository.getSummary(preset);
  }
}
