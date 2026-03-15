import type { DashboardSummary } from "@pdv/shared";
import { prisma } from "../config/database.js";
import type { PeriodPreset } from "../services/dashboard.service.js";

const PAYMENT_METHOD_KEYS = ["cash", "pix", "credit_card", "debit_card", "fiado"] as const;

type SaleWithPayments = {
  total_cents: number;
  discount_cents: number;
  status: string;
  payment_method: string;
  payments: Array<{
    method: string;
    amount_cents: number;
  }>;
};

function resolveDateRange(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "yesterday") {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 1);
    return { from, to: startOfToday };
  }

  if (preset === "week") {
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - 6);
    const to = new Date(startOfToday);
    to.setDate(to.getDate() + 1);
    return { from, to };
  }

  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(startOfToday);
    to.setDate(to.getDate() + 1);
    return { from, to };
  }

  // default: today
  const to = new Date(startOfToday);
  to.setDate(to.getDate() + 1);
  return { from: startOfToday, to };
}

export class DashboardRepository {
  async getSummary(preset: PeriodPreset = "today"): Promise<DashboardSummary> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const { from: periodFrom, to: periodTo } = resolveDateRange(preset);

    const [
      salesToday,
      salesYesterday,
      products,
      overdueCustomers,
      unreadNotificationsCount,
      criticalNotifications,
      openCashRegister,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: {
          created_at: {
            gte: periodFrom,
            lt: periodTo,
          },
          deleted_at: null,
        },
        select: {
          total_cents: true,
          discount_cents: true,
          status: true,
          payment_method: true,
          payments: {
            select: {
              method: true,
              amount_cents: true,
            },
          },
        },
      }),
      prisma.sale.findMany({
        where: {
          created_at: {
            gte: startOfYesterday,
            lt: startOfDay,
          },
          status: "completed",
          deleted_at: null,
        },
        select: {
          total_cents: true,
        },
      }),
      prisma.product.findMany({
        where: {
          deleted_at: null,
        },
        select: {
          id: true,
          name: true,
          stock_quantity: true,
          min_stock_alert: true,
          is_bulk: true,
          product_type: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.customer.findMany({
        where: {
          is_active: false,
          current_debt_cents: {
            gt: 0,
          },
          deleted_at: null,
        },
        orderBy: {
          current_debt_cents: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          phone: true,
          current_debt_cents: true,
          payment_due_day: true,
        },
      }),
      prisma.notification.count({
        where: {
          read_at: null,
        },
      }),
      prisma.notification.findMany({
        where: {
          severity: {
            in: ["critical", "high"],
          },
          read_at: null,
        },
        orderBy: {
          created_at: "desc",
        },
        take: 5,
        select: {
          id: true,
          type: true,
          severity: true,
          title: true,
          message: true,
          meta: true,
          created_at: true,
        },
      }),
      prisma.cashRegister.findFirst({
        where: {
          status: "open",
          opened_at: {
            gte: startOfDay,
          },
        },
        orderBy: {
          opened_at: "desc",
        },
        include: {
          operator: {
            select: {
              name: true,
            },
          },
          transactions: {
            where: {
              type: {
                in: ["cash_in", "cash_out"],
              },
            },
            select: {
              type: true,
              amount_cents: true,
            },
          },
        },
      }),
    ]);

    const financial = this.buildFinancialSummary(salesToday);

    const yesterdayTotalSalesCents = salesYesterday.reduce((total, sale) => total + sale.total_cents, 0);
    const yesterdaySalesCount = salesYesterday.length;

    const financialYesterday = {
      total_sales_cents: yesterdayTotalSalesCents,
      total_sales_count: yesterdaySalesCount,
      average_ticket_cents: yesterdaySalesCount > 0 ? Math.round(yesterdayTotalSalesCents / yesterdaySalesCount) : 0,
    };

    const stockAlerts = products
      .filter((product) => product.stock_quantity <= product.min_stock_alert)
      .sort((left, right) => left.stock_quantity - right.stock_quantity)
      .slice(0, 10)
      .map((product) => ({
        product_id: product.id,
        product_name: product.name,
        stock_quantity: product.stock_quantity,
        min_stock_alert: product.min_stock_alert,
        is_bulk: product.is_bulk,
        product_type_name: product.product_type?.name ?? "Sem tipo",
      }));

    const mappedOverdueCustomers = overdueCustomers.map((customer) => ({
      customer_id: customer.id,
      customer_name: customer.name,
      phone: customer.phone,
      current_debt_cents: customer.current_debt_cents,
      payment_due_day: customer.payment_due_day,
    }));

    const mappedCriticalNotifications = criticalNotifications.map((notification) => ({
      ...notification,
      created_at: notification.created_at.toISOString(),
    }));

    const openCashRegisterSummary = this.buildOpenCashRegister(openCashRegister);

    return {
      financial,
      financial_yesterday: financialYesterday,
      stock_alerts: stockAlerts,
      overdue_customers: mappedOverdueCustomers,
      unread_notifications_count: unreadNotificationsCount,
      critical_notifications: mappedCriticalNotifications,
      open_cash_register: openCashRegisterSummary,
    };
  }

  private buildFinancialSummary(sales: SaleWithPayments[]): DashboardSummary["financial"] {
    const completedSales = sales.filter((sale) => sale.status === "completed");
    const cancellationSales = sales.filter((sale) => sale.status === "cancelled" || sale.status === "refunded");

    const totalSalesCents = completedSales.reduce((total, sale) => total + sale.total_cents, 0);
    const totalSalesCount = completedSales.length;

    const cancellationsTotalCents = cancellationSales.reduce((total, sale) => total + sale.total_cents, 0);

    const discountTotalCents = sales.reduce((total, sale) => total + sale.discount_cents, 0);
    const discountOccurrences = sales.filter((sale) => sale.discount_cents > 0).length;

    const byPaymentMethod = this.aggregateByPaymentMethod(completedSales);

    return {
      total_sales_cents: totalSalesCents,
      total_sales_count: totalSalesCount,
      average_ticket_cents: totalSalesCount > 0 ? Math.round(totalSalesCents / totalSalesCount) : 0,
      cancellations_count: cancellationSales.length,
      cancellations_total_cents: cancellationsTotalCents,
      discount_total_cents: discountTotalCents,
      discount_occurrences: discountOccurrences,
      by_payment_method: byPaymentMethod,
    };
  }

  private aggregateByPaymentMethod(completedSales: SaleWithPayments[]): Record<string, number> {
    const totals: Record<string, number> = {
      cash: 0,
      pix: 0,
      credit_card: 0,
      debit_card: 0,
      fiado: 0,
      mixed: 0,
      unknown: 0,
    };

    for (const sale of completedSales) {
      if (sale.payments.length > 0) {
        for (const payment of sale.payments) {
          totals[payment.method] = (totals[payment.method] ?? 0) + payment.amount_cents;
        }

        continue;
      }

      totals[sale.payment_method] = (totals[sale.payment_method] ?? 0) + sale.total_cents;
    }

    for (const methodKey of PAYMENT_METHOD_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(totals, methodKey)) {
        totals[methodKey] = 0;
      }
    }

    return totals;
  }

  private buildOpenCashRegister(
    register: {
      id: string;
      opened_at: Date;
      opening_balance_cents: number;
      operator: {
        name: string;
      };
      transactions: Array<{
        type: string;
        amount_cents: number;
      }>;
    } | null,
  ): DashboardSummary["open_cash_register"] {
    if (!register) {
      return null;
    }

    const currentBalanceCents = register.transactions.reduce((balance, transaction) => {
      if (transaction.type === "cash_in") {
        return balance + transaction.amount_cents;
      }

      if (transaction.type === "cash_out") {
        return balance - transaction.amount_cents;
      }

      return balance;
    }, 0);

    return {
      id: register.id,
      opened_at: register.opened_at.toISOString(),
      operator_name: register.operator.name,
      initial_amount_cents: register.opening_balance_cents,
      current_balance_cents: currentBalanceCents,
    };
  }
}
