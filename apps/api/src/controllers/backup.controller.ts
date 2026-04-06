import { Request, Response } from "express";
import { BackupService } from "../services/backup.service.js";
import { prisma } from "../config/database.js";
import fsSync from "fs";
import path from "path";
import { logError } from "../utils/logger.js";

export class BackupController {
  private backupService = new BackupService();

  async listBackups(_req: Request, res: Response): Promise<void> {
    const records = await prisma.backupHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: records });
  }

  async testPath(req: Request, res: Response): Promise<void> {
    const { path: dirPath } = req.body;
    if (!dirPath) {
      res.status(400).json({ success: false, message: "Caminho não fornecido." });
      return;
    }
    try {
      const fs = (await import("fs/promises")).default;
      await fs.mkdir(dirPath, { recursive: true });
      const testFile = path.join(dirPath, `.test_${Math.random().toString(36).substring(7)}`);
      await fs.writeFile(testFile, "");
      await fs.unlink(testFile);
      res.json({ success: true, message: "Caminho válido e com permissão de escrita." });
    } catch (error: any) {
      res.status(400).json({ success: false, message: `Erro ao acessar diretório: ${error.message}` });
    }
  }

  async generate(_req: Request, res: Response): Promise<void> {
    try {
      const history = await this.backupService.generateBackup();
      res.json({ success: true, data: history });
    } catch (error: any) {
      logError("Erro ao disparar backup manual", error, { tag: "BackupController" });
      res.status(500).json({ success: false, message: "Falha ao gerar backup: " + error.message });
    }
  }

  async download(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      // @ts-ignore - Aguardando prisma generate
      const history = await prisma.backupHistory.findUnique({ where: { id } });
      
      const filePath = history?.filePath;
      if (!history || !filePath) {
        res.status(404).json({ success: false, message: "Registro de backup não encontrado." });
        return;
      }
      
      const absolutePath = path.resolve(filePath);
      
      if (!fsSync.existsSync(absolutePath)) {
        res.status(404).json({ success: false, message: "Arquivo de backup não encontrado no disco." });
        return;
      }
      
      res.download(absolutePath, path.basename(absolutePath));
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erro ao processar download: " + error.message });
    }
  }

  async restore(req: Request, res: Response): Promise<void> {
    const file = (req as any).file;
    const { scope, password } = req.body;

    if (!file) {
      res.status(400).json({ success: false, message: "Arquivo de backup não enviado." });
      return;
    }

    try {
      const message = await this.backupService.restoreBackup(file, scope, password);
      res.json({ success: true, message });
    } catch (error: any) {
      logError("Erro no restore", error, { tag: "Backup" });
      res.status(500).json({ success: false, message: error.message || "Erro na restauração." });
    }
  }
}
