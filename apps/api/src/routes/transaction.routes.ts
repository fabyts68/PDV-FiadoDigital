import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

export const transactionRouter = Router();
const transactionController = new TransactionController();

transactionRouter.get(
  "/",
  authenticate,
  authorize("admin", "manager"),
  transactionController.list.bind(transactionController),
);
