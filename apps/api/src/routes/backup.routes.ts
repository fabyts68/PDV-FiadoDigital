import { Router } from "express";
import { BackupController } from "../controllers/backup.controller.js";
import multer from "multer";
import os from "os";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

// Configuração do multer para upload de arquivos temporários
const upload = multer({ dest: os.tmpdir() });
const backupController = new BackupController();

export const backupRouter = Router();

// Listar histórico de backups
backupRouter.get("/", authenticate, authorize("admin"), (req, res) => backupController.listBackups(req, res));

// Endpoint para testar se um caminho existe e é gravável
backupRouter.post("/test-path", (req, res) => backupController.testPath(req, res));

// Geração manual de backup
backupRouter.post("/generate", (req, res) => backupController.generate(req, res));

// Download de backup existente
backupRouter.get("/download/:id", (req, res) => backupController.download(req, res));

// Restauração de backup (upload de arquivo)
backupRouter.post("/restore", upload.single("file"), (req, res) => backupController.restore(req, res));
