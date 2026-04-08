import { prisma } from "../config/database.js";
import fs from "node:fs";
import { mkdir, writeFile, readFile, unlink, copyFile } from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import BetterSqlite3 from "better-sqlite3";
import { CloudStorageService } from "./cloud-storage.service.js";
import { config } from "../config/index.js";
import { logInfo, logError } from "../utils/logger.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 10000;

export class BackupService {
  private cloudStorageService = new CloudStorageService();

  private async getEncryptionKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, "sha256", (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }

  private async encrypt(buffer: Buffer, password: string): Promise<Buffer> {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = await this.getEncryptionKey(password, salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Formato do arquivo: SALT (16) + IV (12) + AUTH_TAG (16) + DATA
    return Buffer.concat([salt, iv, authTag, encrypted]);
  }

  async generateBackup(): Promise<any> {
    const backupHistoryRecord = await prisma.backupHistory.create({
      data: {
        sizeBytes: 0,
        status: "pending",
        filePath: "",
      },
    });

    try {
      // 1. Buscar configurações
      const settingsRaw = await prisma.settings.findMany({
        where: {
          key: {
            in: [
              "backup_path",
              "backup_encryption_enabled",
              "backup_password",
              "backup_cloud_enabled",
              "backup_cloud_token",
              "backup_retention",
            ],
          },
        },
      });

      const settingsMap: Record<string, string | null> = {};
      for (const s of settingsRaw) {
        settingsMap[s.key] = s.value;
      }
      
      const backupDir = settingsMap.backup_path || "/var/backups/pdv";
      const resolvedBackupDir = path.resolve(backupDir);
      const isEncryptionEnabled = settingsMap.backup_encryption_enabled === "true";
      const password = settingsMap.backup_password;
      const isCloudEnabled = settingsMap.backup_cloud_enabled === "true";
      const cloudToken = settingsMap.backup_cloud_token;
      const retention = Number(settingsMap.backup_retention) || 7;

      // Garantir que o diretório de backups exista
      await mkdir(resolvedBackupDir, { recursive: true });

      // 2. Dump do Banco (Checkpoint & Copy)
      const tempDbPath = path.resolve(resolvedBackupDir, `temp_${Date.now()}.db`);
      
      // Garantir diretório pai do arquivo temporário de forma explícita e síncrona
      const dirPath = path.dirname(tempDbPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // NOVO FLUXO: Checkpoint do WAL e cópia nativa do arquivo
      // 3.1 Forçar a gravação de dados pendentes do WAL para o arquivo principal
      await prisma.$executeRawUnsafe(`PRAGMA wal_checkpoint(TRUNCATE)`);

      // 3.2 Obter o caminho do banco original
      // Removendo o prefixo 'file:' se existir na variável de ambiente
      let sourceDbPath = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
      sourceDbPath = path.resolve(process.cwd(), sourceDbPath);

      // 3.3 Copiar o arquivo via Node.js (Garante que o arquivo existirá na próxima linha)
      await copyFile(sourceDbPath, tempDbPath);

      // 4. Compactar e Criptografar
      let data = await readFile(tempDbPath);
      data = zlib.gzipSync(data);

      let finalExtension = ".db.gz";
      if (isEncryptionEnabled && password) {
        data = (await this.encrypt(data, password)) as any;
        finalExtension = ".db.enc";
      }

      const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}${finalExtension}`;
      const finalPath = path.join(resolvedBackupDir, fileName);

      // Garantir diretório do arquivo final de forma síncrona
      const finalDirPath = path.dirname(finalPath);
      if (!fs.existsSync(finalDirPath)) {
        fs.mkdirSync(finalDirPath, { recursive: true });
      }

      await writeFile(finalPath, data);

      // Verificação rigorosa do sistema de arquivos após tentativa de escrita
      if (!fs.existsSync(finalPath)) {
        throw new Error(`Falha na gravação: O arquivo de backup não foi encontrado no disco após a escrita em '${finalPath}'`);
      }

      await unlink(tempDbPath);

      // 4. Cloud Upload (se habilitado)
      if (isCloudEnabled && cloudToken) {
        await this.cloudStorageService.uploadBackup(finalPath, cloudToken);
      }

      // 5. Atualizar histórico
      const updatedHistory = await prisma.backupHistory.update({
        where: { id: backupHistoryRecord.id },
        data: {
          sizeBytes: data.length,
          status: "success",
          filePath: finalPath,
        },
      });

      // 6. Política de Retenção
      await this.enforceRetention(retention);

      return updatedHistory;
    } catch (error: any) {
      logError("Falha ao gerar backup", error, { tag: "BackupService" });
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido na geração do backup";

      await prisma.backupHistory.update({
        where: { id: backupHistoryRecord.id },
        data: {
          status: "error",
          errorMessage: errorMessage,
        },
      });

      throw error;
    }
  }

  private async decrypt(buffer: Buffer, password: string): Promise<Buffer> {
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
    const encryptedData = buffer.subarray(SALT_LENGTH + IV_LENGTH + 16);

    const key = await this.getEncryptionKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  async restoreBackup(file: { path: string; originalname: string }, scope: string, password?: string): Promise<string> {
    let data = await readFile(file.path);

    if (file.originalname.endsWith(".enc")) {
      if (!password) {
        throw new Error("Senha obrigatória para backups criptografados.");
      }
      try {
        data = (await this.decrypt(data, password)) as any;
      } catch (err) {
        throw new Error("Senha de descriptografia inválida.");
      }
    }

    try {
      const decompressed = zlib.gunzipSync(data);
      data = decompressed;
    } catch (err) {
      // Provavelmente não está compactado com gzip
    }

    const restoreTempDb = path.join(process.cwd(), "data", `restore_${Date.now()}.db`);
    await writeFile(restoreTempDb, data);

    try {
      if (scope === "full") {
        const mainDbPath = config.databaseUrl.replace("file:", "");
        setTimeout(async () => {
          try {
            await copyFile(restoreTempDb, mainDbPath);
            await unlink(restoreTempDb);
            logInfo("Restore total concluído. Reiniciando serviço...", { tag: "Backup" });
            process.exit(0);
          } catch (err) {
            logError("Erro FATAL ao substituir banco principal", err, { tag: "Backup" });
          }
        }, 1000);
        return "Restauração total iniciada. O serviço será reiniciado em instantes.";
      } else {
        const tables: Record<string, string[]> = {
          products: ["product", "stock_movements", "brands", "product_types"],
          customers: ["customer"],
          types: ["product_types"],
          notifications: ["notifications"],
        };

        const targetTables = tables[scope] || [];
        if (targetTables.length === 0) {
          throw new Error("Escopo de restauração inválido.");
        }

        // Força o checkpoint do WAL no arquivo de backup antes de qualquer ATTACH,
        // eliminando o lock residual que causa "database backup_db is locked".
        const checkpointDb = new BetterSqlite3(restoreTempDb, { readonly: false });
        try {
          checkpointDb.pragma("wal_checkpoint(TRUNCATE)");
          checkpointDb.pragma("journal_mode = DELETE");
        } finally {
          checkpointDb.close();
        }

        await prisma.$transaction(async (tx) => {
          try {
            await tx.$executeRawUnsafe(`ATTACH DATABASE '${restoreTempDb}' AS backup_db`);
            await tx.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
            for (const table of targetTables) {
              await tx.$executeRawUnsafe(`DELETE FROM main."${table}"`);
              await tx.$executeRawUnsafe(`INSERT INTO main."${table}" SELECT * FROM backup_db."${table}"`);
            }
            await tx.$executeRawUnsafe("PRAGMA foreign_keys = ON");
          } finally {
            try {
              await tx.$executeRawUnsafe("DETACH DATABASE backup_db");
            } catch {
              // ignora erro de DETACH
            }
          }
        });

        return `Restauração parcial (${scope}) concluída com sucesso.`;
      }
    } finally {
      // Garante a limpeza do arquivo temporário e do upload após o DETACH
      await unlink(restoreTempDb).catch(() => {});
      await unlink(file.path).catch(() => {});
    }
  }

  private async enforceRetention(retention: number): Promise<void> {
    try {
      const allBackups = await prisma.backupHistory.findMany({
        where: { status: "success" },
        orderBy: { createdAt: "desc" },
      });

      if (allBackups.length <= retention) {
        return;
      }

      const backupsToDelete = allBackups.slice(retention);

      for (const backup of backupsToDelete) {
        try {
          if (backup.filePath) {
            await unlink(backup.filePath);
          }
          await prisma.backupHistory.delete({
            where: { id: backup.id },
          });
          logInfo(`Backup antigo removido (retenção): ${backup.filePath}`, { tag: "BackupService" });
        } catch (err: any) {
          logError(`Falha ao remover arquivo de backup físico para retenção: ${err instanceof Error ? err.message : "Erro desconhecido"}`, err, { tag: "BackupService" });
          // Removemos do banco mesmo que o arquivo já tenha sumido
          await prisma.backupHistory.delete({
            where: { id: backup.id },
          }).catch(() => {});
        }
      }
    } catch (error: any) {
      logError("Erro na política de retenção", error, { tag: "BackupService" });
    }
  }
}
