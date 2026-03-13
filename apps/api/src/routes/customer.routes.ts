import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { pinRateLimiter } from "../middlewares/rate-limiter.middleware.js";
import {
  validateCreateCustomer,
  validateListCustomers,
  validateUpdateCustomer,
  validatePayDebt,
} from "../validators/customer.validator.js";

export const customerRouter = Router();
const controller = new CustomerController();

customerRouter.get("/", authenticate, validateListCustomers, controller.list);
customerRouter.get(
  "/:id/fiado-history",
  authenticate,
  authorize("admin", "manager"),
  controller.getFiadoHistory,
);
customerRouter.get(
  "/:id/payment-history",
  authenticate,
  authorize("admin", "manager"),
  controller.getPaymentHistory,
);
customerRouter.get("/:id", authenticate, controller.getById);
customerRouter.post(
  "/",
  authenticate,
  authorize("admin", "manager"),
  validateCreateCustomer,
  controller.create,
);
customerRouter.put(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  validateUpdateCustomer,
  controller.update,
);
customerRouter.post(
  "/:id/pay-debt",
  pinRateLimiter,
  authenticate,
  authorize("admin", "manager"),
  validatePayDebt,
  controller.payDebt,
);
customerRouter.delete(
  "/:id",
  authenticate,
  authorize("admin", "manager"),
  controller.deactivate,
);
