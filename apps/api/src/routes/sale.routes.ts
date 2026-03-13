import { Router } from "express";
import { SaleController } from "../controllers/sale.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { pinRateLimiter } from "../middlewares/rate-limiter.middleware.js";
import {
  validateCreateSale,
  validateListSales,
  validateCancelSale,
  validateRefundSale,
} from "../validators/sale.validator.js";

export const saleRouter = Router();
const controller = new SaleController();

saleRouter.get(
  "/",
  authenticate,
  authorize("admin", "manager", "operator"),
  validateListSales,
  controller.list,
);
saleRouter.get(
  "/:id",
  authenticate,
  authorize("admin", "manager", "operator"),
  controller.getById,
);
saleRouter.post(
  "/",
  authenticate,
  authorize("admin", "manager", "operator"),
  validateCreateSale,
  controller.create,
);
saleRouter.post(
  "/:id/cancel",
  pinRateLimiter,
  authenticate,
  authorize("admin", "manager", "operator"),
  validateCancelSale,
  controller.cancel,
);
saleRouter.post(
  "/:id/refund",
  pinRateLimiter,
  authenticate,
  authorize("admin", "manager", "operator"),
  validateRefundSale,
  controller.refund,
);
