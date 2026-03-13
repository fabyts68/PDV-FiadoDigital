import { Router } from "express";
import { ControlController } from "../controllers/control.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

export const controlRouter = Router();
const controller = new ControlController();

controlRouter.use(authenticate);
controlRouter.use(authorize("admin"));

controlRouter.get("/stock-summary", controller.getStockSummary);
controlRouter.get("/cash-summary", controller.getCashSummary);
controlRouter.get("/discount-summary", controller.getDiscountSummary);
controlRouter.get("/cancellations", controller.getCancellations);
