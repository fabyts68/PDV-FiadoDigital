import { Router } from "express";
import { StockMovementController } from "../controllers/stock-movement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validateCreateStockAdjustment } from "../validators/control.validator.js";

export const stockMovementRouter = Router();
const controller = new StockMovementController();

stockMovementRouter.use(authenticate);

stockMovementRouter.get(
  "/:productId",
  authorize("admin"),
  controller.listByProductId,
);

stockMovementRouter.post(
  "/adjustment",
  authorize("admin"),
  validateCreateStockAdjustment,
  controller.createAdjustment,
);
