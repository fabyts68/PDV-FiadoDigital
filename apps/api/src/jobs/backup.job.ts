import cron from "node-cron";
import { prisma } from "../config/database.js";
import { BackupService } from "../services/backup.service.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * Serviço de agendamento de backups automáticos.
 * Escaneia as configurações de horário e frequência do banco.
 */
export async function startBackupJob(): Promise<void> {
  const backupService = new BackupService();

  // 1. Carregar configurações iniciais
  const settingsRaw = await prisma.settings.findMany({
    where: {
      key: {
        in: ["backup_time", "backup_frequency", "backup_enabled"],
      },
    },
  });

  const settingsMap = settingsRaw.reduce(
    (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
    {} as any
  );

  const backupTime = settingsMap.backup_time || "03:00"; // Default: 3 da manhã
  const backupFrequency = settingsMap.backup_frequency || "daily";
  const backupEnabled = settingsMap.backup_enabled !== "false"; // Default: true se configurado

  if (!backupEnabled) {
    logInfo("Agendamento de backup automático desativado.", { tag: "BackupJob" });
    return;
  }

  // 2. Traduzir HH:mm para cron expression
  // Formato: minute hour dayOfMonth month dayOfWeek
  const [hour, minute] = backupTime.split(":").map((v: string) => parseInt(v));
  
  let cronExpression = `${minute || 0} ${hour || 0} * * *`; // Daily por padrão

  if (backupFrequency === "weekly") {
    cronExpression = `${minute || 0} ${hour || 0} * * 0`; // Todo domingo
  } else if (backupFrequency === "monthly") {
    cronExpression = `${minute || 0} ${hour || 0} 1 * *`; // Todo dia 1
  }

  logInfo(`Backup agendado para: ${backupTime} (${backupFrequency}) -> ${cronExpression}`, { tag: "BackupJob" });

  // 3. Agendar tarefa
  cron.schedule(cronExpression, async () => {
    logInfo(`Iniciando execução automática em: ${new Date().toISOString()}`, { tag: "BackupJob" });
    try {
      await backupService.generateBackup();
      logInfo(`Execução automática concluída com sucesso.`, { tag: "BackupJob" });
    } catch (error: any) {
      logError(`Falha na execução automática: ${error.message}`, error, { tag: "BackupJob" });
    }
  });

  // 4. Execução imediata opcional se necessário (ex: se o sistema ficou offline no horário)
  // Por ora, apenas registra o próximo agendamento.
}
