import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

export const dashboardRouter = Router();
const controller = new DashboardController();

dashboardRouter.get(
  "/dashboard-summary",
  authenticate,
  authorize("admin", "manager"),
  controller.getSummary,
);
