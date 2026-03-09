import { Router } from "express";
import { BrandController } from "../controllers/brand.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  validateCreateBrand,
  validateUpdateBrand,
} from "../validators/brand.validator.js";

export const brandRouter = Router();
const controller = new BrandController();

brandRouter.use(authenticate);

brandRouter.get("/", controller.list);
brandRouter.post(
  "/",
  authorize("admin", "manager", "stockist"),
  validateCreateBrand,
  controller.create,
);
brandRouter.put(
  "/:id",
  authorize("admin", "manager"),
  validateUpdateBrand,
  controller.update,
);
brandRouter.delete(
  "/:id",
  authorize("admin", "manager"),
  controller.deactivate,
);