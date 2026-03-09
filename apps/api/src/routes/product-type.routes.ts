import { Router } from "express";
import { ProductTypeController } from "../controllers/product-type.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  validateCreateProductType,
  validateUpdateProductType,
} from "../validators/product-type.validator.js";

export const productTypeRouter = Router();
const controller = new ProductTypeController();

productTypeRouter.use(authenticate);

productTypeRouter.get("/", controller.list);
productTypeRouter.post(
  "/",
  authorize("admin", "manager"),
  validateCreateProductType,
  controller.create,
);
productTypeRouter.put(
  "/:id",
  authorize("admin", "manager"),
  validateUpdateProductType,
  controller.update,
);
productTypeRouter.delete(
  "/:id",
  authorize("admin", "manager"),
  controller.deactivate,
);
