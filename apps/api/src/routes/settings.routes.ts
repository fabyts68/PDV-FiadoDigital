import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import { validateUpdateGeneralSettings, validateUpdatePixSettings } from "../validators/settings.validator.js";

export const settingsRouter = Router();
const controller = new SettingsController();

settingsRouter.use(authenticate);

settingsRouter.get("/", authorize("admin"), controller.getSettings);
settingsRouter.put("/", authorize("admin"), validateUpdateGeneralSettings, controller.updateSettings);

// GET /api/settings/pix - Busca configurações do Pix
settingsRouter.get("/pix", authorize("admin"), controller.getPixSettings);

// PUT /api/settings/pix - Atualiza configurações do Pix
settingsRouter.put("/pix", authorize("admin"), validateUpdatePixSettings, controller.updatePixSettings);
