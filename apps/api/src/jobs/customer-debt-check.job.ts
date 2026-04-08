import { CustomerRepository } from "../repositories/customer.repository.js";
import { SettingsRepository } from "../repositories/settings.repository.js";
import { NotificationService } from "../services/notification.service.js";
import { formatCents, NOTIFICATION_TYPES, NOTIFICATION_SEVERITIES } from "@pdv/shared";
import { logInfo, logError } from "../utils/logger.js";

const customerRepository = new CustomerRepository();
const settingsRepository = new SettingsRepository();
const notificationService = new NotificationService();
const FIADO_ALERT_ON_DUE_DAY_SETTING = "fiado_alert_on_due_day";

/**
 * Job de verificação periódica de clientes com atraso no pagamento do fiado.
 * Inativa automaticamente clientes com dívida vencida.
 *
 * Este job é executado uma vez por dia (configurável).
 * Clientes são inativados quando:
 * - Possuem dívida positiva (current_debt_cents > 0)
 * - Têm um dia de pagamento configurado (payment_due_day)
 * - O dia corrente é posterior ao dia de vencimento
 * - Estão ativos (is_active: true)
 */
export async function startCustomerDebtCheckJob(): Promise<void> {
  // Executar a verificação imediatamente ao iniciar
  await runCustomerDebtCheck();

  // Agendar para executar a cada 24 horas
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      await runCustomerDebtCheck();
    } catch (error) {
      logError("Erro ao executar customer-debt-check job", error);
    }
  }, TWENTY_FOUR_HOURS);

  logInfo("Customer debt check iniciado com interpretação diária", { tag: "Job" });
}

async function runCustomerDebtCheck(): Promise<void> {
  try {
    const result = await customerRepository.checkAndDeactivateOverdueCustomers();
    if (result.count > 0) {
      logInfo(`${result.count} clientes foram inativados por atraso no pagamento`, { tag: "Job" });
    }

    // Emitir notificações para clientes com fiado vencido e saldo em aberto
    const overdueCustomers = await customerRepository.findOverdueWithDebt();
    for (const customer of overdueCustomers) {
      notificationService.createFiadoNotificationOncePerDay({
        type: NOTIFICATION_TYPES.FIADO_OVERDUE,
        severity: NOTIFICATION_SEVERITIES.HIGH,
        title: `Fiado vencido: ${customer.name}`,
        message: `O cliente "${customer.name}" possui saldo em aberto de ${formatCents(customer.current_debt_cents)} com pagamento vencido.`,
        meta: JSON.stringify({ customerId: customer.id, redirectPath: "/customers" }),
        target_roles: ["admin", "manager"],
      }).catch((err: unknown) => logError("Erro ao criar notificação de fiado vencido", err, { tag: "Job" }));
    }

    const dueDayAlertSetting = await settingsRepository.findByKey(FIADO_ALERT_ON_DUE_DAY_SETTING);
    const shouldNotifyDueDay = dueDayAlertSetting?.value !== "false";

    if (!shouldNotifyDueDay) {
      return;
    }

    const dueDayCustomers = await customerRepository.findDueDayWithDebt();

    for (const customer of dueDayCustomers) {
      notificationService.createFiadoNotificationOncePerDay({
        type: NOTIFICATION_TYPES.FIADO_DUE_DAY_DEBT_OPEN,
        severity: NOTIFICATION_SEVERITIES.HIGH,
        title: `Fiado vencendo hoje: ${customer.name}`,
        message: `O cliente "${customer.name}" está no dia de vencimento com saldo em aberto de ${formatCents(customer.current_debt_cents)}.`,
        meta: JSON.stringify({ customerId: customer.id, redirectPath: "/customers" }),
        target_roles: ["admin", "manager"],
      }).catch((err: unknown) => logError("Erro ao criar notificação de fiado no vencimento", err, { tag: "Job" }));
    }
  } catch (error) {
    logError("Erro ao verificar clientes em atraso", error);
    throw error;
  }
}
