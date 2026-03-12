import { Router } from "express";
import { ControlController } from "../controllers/control.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validateCreateStockAdjustment } from "../validators/control.validator.js";

export const controlRouter = Router();
const controller = new ControlController();

controlRouter.use(authenticate);
controlRouter.use(authorize("admin"));

controlRouter.get("/stock-summary", controller.getStockSummary);
controlRouter.get("/stock-movements/:productId", controller.getStockMovements);
controlRouter.post("/stock-adjustment", validateCreateStockAdjustment, controller.createStockAdjustment);
controlRouter.get("/cash-summary", controller.getCashSummary);
controlRouter.get("/discount-summary", controller.getDiscountSummary);
controlRouter.get("/cancellations", controller.getCancellations);
