import { SaleRepository } from "../repositories/sale.repository.js";
import { CustomerRepository } from "../repositories/customer.repository.js";
import { AuthService } from "./auth.service.js";
import { AuditLogRepository } from "../repositories/audit-log.repository.js";
import { broadcast } from "../websocket/index.js";
import { formatCents, PAYMENT_METHODS } from "@pdv/shared";
import type { CreateSalePayload } from "@pdv/shared";
import type { SaleQueryParams } from "../repositories/sale.repository.js";

const saleRepository = new SaleRepository();
const customerRepository = new CustomerRepository();
const authService = new AuthService();
const auditLogRepository = new AuditLogRepository();

export class SaleService {
  async list(params: SaleQueryParams) {
    return saleRepository.findAll(params);
  }

  async getById(id: string) {
    const sale = await saleRepository.findById(id);

    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    return sale;
  }

  async create(payload: CreateSalePayload) {
    // Idempotência: rejeitar UUID duplicado
    const existing = await saleRepository.findByUuid(payload.uuid);

    if (existing) {
      return existing;
    }

    const subtotalCents = payload.items.reduce(
      (sum, item) =>
        sum + Math.round(item.unit_price_cents * item.quantity) - item.discount_cents,
      0,
    );
    const baseTotalCents = subtotalCents - payload.discount_cents;
    const totalCents = payload.total_cents ?? baseTotalCents;
    const paymentTotalCents = payload.payments.reduce(
      (sum, payment) => sum + payment.amount_cents,
      0,
    );
    const uniquePaymentMethodsCount = new Set(
      payload.payments.map((payment) => payment.method),
    ).size;

    if (payload.payments.length === 0) {
      throw new Error("Dados inválidos: É obrigatório informar ao menos um pagamento.");
    }

    if (payload.payments.length > 2 || uniquePaymentMethodsCount > 2) {
      throw new Error("Dados inválidos: A venda permite no máximo 2 meios de pagamento distintos.");
    }

    if (uniquePaymentMethodsCount !== payload.payments.length) {
      throw new Error("Dados inválidos: Não é permitido repetir o mesmo meio de pagamento.");
    }

    if (paymentTotalCents !== totalCents) {
      throw new Error("Dados inválidos: A soma dos pagamentos deve ser igual ao total da venda.");
    }

    const hasMultipleMethods = uniquePaymentMethodsCount > 1;

    if (hasMultipleMethods && payload.payment_method !== PAYMENT_METHODS.MIXED) {
      throw new Error("Dados inválidos: payment_method deve ser 'mixed' quando houver mais de um meio de pagamento.");
    }

    if (!hasMultipleMethods && payload.payment_method === PAYMENT_METHODS.MIXED) {
      throw new Error("Dados inválidos: payment_method não pode ser 'mixed' com apenas um meio de pagamento.");
    }

    // Validar limite de crédito quando houver pagamento no fiado
    const fiadoPayments = payload.payments.filter(
      (payment) => payment.method === PAYMENT_METHODS.FIADO,
    );

    if (fiadoPayments.length > 0) {
      if (!payload.customer_id) {
        throw new Error("Dados inválidos: Cliente é obrigatório para pagamento no fiado.");
      }

      const customer = await customerRepository.findById(payload.customer_id);

      if (!customer) {
        throw new Error("Cliente não encontrado");
      }

      if (!customer.is_active) {
        throw new Error("Não é possível registrar uma venda para um cliente inativo.");
      }

      if (customer.credit_blocked) {
        throw new Error("Dados inválidos: Cliente com crédito bloqueado não pode comprar no fiado.");
      }

      const fiadoTotalCents = fiadoPayments.reduce(
        (sum, payment) => sum + payment.amount_cents,
        0,
      );
      const availableCredit = customer.credit_limit_cents - customer.current_debt_cents;

      if (fiadoTotalCents > availableCredit) {
        throw new Error(`Saldo de crédito insuficiente. Disponível: ${formatCents(availableCredit)}.`);
      }
    } else if (payload.customer_id) {
      const customer = await customerRepository.findById(payload.customer_id);

      if (customer && !customer.is_active) {
        throw new Error("Não é possível registrar uma venda para um cliente inativo.");
      }
    }

    const result = await saleRepository.create(payload);

    // Emitir alertas de estoque baixo via WebSocket
    if (result.lowStockProducts && result.lowStockProducts.length > 0) {
      for (const product of result.lowStockProducts) {
        broadcast({
          type: "stock.low_alert",
          payload: {
            productId: product.productId,
            productName: product.productName,
            stock_quantity: product.stock_quantity,
            min_stock_alert: product.min_stock_alert,
          },
        });
      }
    }

    return result.sale;
  }

  async cancel(id: string, managerPin: string, operatorId: string) {
    const managerId = await authService.validateManagerPin(managerPin);

    if (!managerId) {
      throw new Error("PIN de gerente inválido.");
    }

    const sale = await saleRepository.findById(id);

    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    if (sale.status !== "completed") {
      throw new Error("Apenas vendas concluídas podem ser canceladas.");
    }

    const today = new Date();
    const saleDate = new Date(sale.created_at);

    if (today.toDateString() !== saleDate.toDateString()) {
      throw new Error("Cancelamento permitido apenas no dia da venda.");
    }

    await saleRepository.cancel(id, operatorId);

    await auditLogRepository.create({
      action: "sale_cancelled",
      actor_id: operatorId,
      entity_type: "sale",
      entity_id: id,
      details: { sale_id: id, operator_id: operatorId, manager_id: managerId },
    });
  }

  async refund(id: string, managerPin: string, operatorId: string) {
    const managerId = await authService.validateManagerPin(managerPin);

    if (!managerId) {
      throw new Error("PIN de gerente inválido.");
    }

    const sale = await saleRepository.findById(id);

    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    if (sale.status !== "completed") {
      throw new Error("Apenas vendas concluídas podem ser estornadas.");
    }

    const today = new Date();
    const saleDate = new Date(sale.created_at);
    const diffMs = today.getTime() - saleDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      throw new Error("Estorno permitido somente até 7 dias após a venda.");
    }

    await saleRepository.refund(id, operatorId);

    await auditLogRepository.create({
      action: "sale_refunded",
      actor_id: operatorId,
      entity_type: "sale",
      entity_id: id,
      details: { sale_id: id, operator_id: operatorId, manager_id: managerId },
    });
  }
}
