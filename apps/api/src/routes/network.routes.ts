import { Router } from "express";
import { getAccessInfo, getLocalIp } from "../controllers/network.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

export const networkRouter = Router();

networkRouter.get("/ip", getLocalIp);
networkRouter.get("/access-info", authenticate, authorize("admin", "manager", "operator"), getAccessInfo);
