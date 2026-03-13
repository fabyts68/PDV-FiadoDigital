import { prisma } from "../config/database.js";
import type {
  Customer,
  CustomerQueryParams,
  PaginatedResult,
  SaleWithPayments,
  SalePayment,
  Transaction,
} from "@pdv/shared";
import { PAYMENT_METHODS } from "@pdv/shared";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;

export interface PeriodFilter {
  month?: number;
  year?: number;
}

export interface FiadoHistorySummary {
  fiado_period_cents: number;
  fiado_open_cents: number;
  fiado_paid_cents: number;
}

export interface PaymentHistorySummary {
  total_paid_period_cents: number;
  fiado_open_cents: number;
}

export interface FiadoHistoryResult extends PaginatedResult<SaleWithPayments> {
  summary: FiadoHistorySummary;
}

export interface PaymentHistoryResult extends PaginatedResult<Transaction> {
  summary: PaymentHistorySummary;
}

function buildCreatedAtRange(filter?: PeriodFilter): { gte: Date; lt: Date } | undefined {
  if (!filter?.month || !filter?.year) {
    return undefined;
  }

  return {
    gte: new Date(filter.year, filter.month - 1, 1),
    lt: new Date(filter.year, filter.month, 1),
  };
}

function toCustomer(customer: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  credit_limit_cents: number;
  current_debt_cents: number;
  payment_due_day: number | null;
  credit_blocked: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): Customer {
  return {
    ...customer,
    created_at: customer.created_at.toISOString(),
    updated_at: customer.updated_at.toISOString(),
  };
}

export class CustomerRepository {
  async findAll(params: CustomerQueryParams): Promise<PaginatedResult<Customer>> {
    const {
      search,
      only_active = false,
      page = 1,
      per_page = DEFAULT_PER_PAGE,
      sort_by = "name",
      sort_order = "asc",
    } = params;

    const normalizedSearch = search?.trim();
    const validPerPage = Math.min(Math.max(per_page || DEFAULT_PER_PAGE, 1), MAX_PER_PAGE);
    const validPage = Math.max(page || 1, 1);

    const where = {
      deleted_at: null,
      ...(only_active ? { is_active: true } : {}),
      ...(normalizedSearch
        ? {
            OR: [
              { name: { contains: normalizedSearch } },
              { phone: { contains: normalizedSearch } },
              { email: { contains: normalizedSearch } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip: (validPage - 1) * validPerPage,
        take: validPerPage,
        orderBy: { [sort_by]: sort_order },
      }),
    ]);

    const totalPages = Math.ceil(total / validPerPage);

    return {
      data: data.map(toCustomer),
      pagination: {
        page: validPage,
        per_page: validPerPage,
        total,
        total_pages: totalPages,
      },
    };
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = await prisma.customer.findFirst({
      where: { id, deleted_at: null },
    });

    if (!customer) {
      return null;
    }

    return toCustomer(customer);
  }

  async findFiadoHistoryByCustomerId(
    id: string,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    filter?: PeriodFilter,
  ): Promise<FiadoHistoryResult> {
    const validPerPage = Math.min(Math.max(perPage || DEFAULT_PER_PAGE, 1), MAX_PER_PAGE);
    const validPage = Math.max(page || 1, 1);
    const createdAtRange = buildCreatedAtRange(filter);

    const where = {
      customer_id: id,
      deleted_at: null,
      status: { in: ["completed", "refunded"] },
      ...(createdAtRange ? { created_at: createdAtRange } : {}),
      OR: [
        { payment_method: PAYMENT_METHODS.FIADO },
        {
          payment_method: PAYMENT_METHODS.MIXED,
          payments: { some: { method: PAYMENT_METHODS.FIADO } },
        },
      ],
    };

    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              sale_id: true,
              product_id: true,
              product_name: true,
              quantity: true,
              unit_price_cents: true,
              discount_cents: true,
              total_cents: true,
            },
          },
          payments: true,
        },
        orderBy: { created_at: "desc" },
        skip: (validPage - 1) * validPerPage,
        take: validPerPage,
      }),
    ]);

    const [fiadoDirectSalesAggregate, fiadoMixedPaymentsAggregate, fiadoPaidAggregate, customer] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          customer_id: id,
          deleted_at: null,
          status: { in: ["completed", "refunded"] },
          payment_method: PAYMENT_METHODS.FIADO,
          ...(createdAtRange ? { created_at: createdAtRange } : {}),
        },
        _sum: { total_cents: true },
      }),
      prisma.salePayment.aggregate({
        where: {
          method: PAYMENT_METHODS.FIADO,
          sale: {
            customer_id: id,
            deleted_at: null,
            status: { in: ["completed", "refunded"] },
            payment_method: PAYMENT_METHODS.MIXED,
            ...(createdAtRange ? { created_at: createdAtRange } : {}),
          },
        },
        _sum: { amount_cents: true },
      }),
      prisma.transaction.aggregate({
        where: {
          type: "fiado_payment",
          customer_id: id,
          ...(createdAtRange ? { created_at: createdAtRange } : {}),
        },
        _sum: { amount_cents: true },
      }),
      prisma.customer.findUnique({
        where: { id },
        select: { current_debt_cents: true },
      }),
    ]);

    const data: SaleWithPayments[] = sales.map((sale) => {
      const payments: SalePayment[] = sale.payments.map((payment) => ({
        method: payment.method as SalePayment["method"],
        amount_cents: payment.amount_cents,
      }));

      return {
        id: sale.id,
        uuid: sale.uuid,
        operator_id: sale.operator_id,
        customer_id: sale.customer_id,
        terminal_id: sale.terminal_id,
        payment_method: sale.payment_method as SaleWithPayments["payment_method"],
        subtotal_cents: sale.subtotal_cents,
        discount_cents: sale.discount_cents,
        total_cents: sale.total_cents,
        status: sale.status as SaleWithPayments["status"],
        items: sale.items,
        created_at: sale.created_at.toISOString(),
        updated_at: sale.updated_at.toISOString(),
        payments,
      };
    });

    const totalPages = Math.ceil(total / validPerPage);
    const fiadoPeriodCents =
      (fiadoDirectSalesAggregate._sum.total_cents ?? 0) +
      (fiadoMixedPaymentsAggregate._sum.amount_cents ?? 0);

    return {
      data,
      pagination: {
        page: validPage,
        per_page: validPerPage,
        total,
        total_pages: totalPages,
      },
      summary: {
        fiado_period_cents: fiadoPeriodCents,
        fiado_open_cents: customer?.current_debt_cents ?? 0,
        fiado_paid_cents: fiadoPaidAggregate._sum.amount_cents ?? 0,
      },
    };
  }

  async findPaymentHistoryByCustomerId(
    id: string,
    page = 1,
    perPage = DEFAULT_PER_PAGE,
    filter?: PeriodFilter,
  ): Promise<PaymentHistoryResult> {
    const validPerPage = Math.min(Math.max(perPage || DEFAULT_PER_PAGE, 1), MAX_PER_PAGE);
    const validPage = Math.max(page || 1, 1);
    const createdAtRange = buildCreatedAtRange(filter);

    const where = {
      type: "fiado_payment",
      customer_id: id,
      ...(createdAtRange ? { created_at: createdAtRange } : {}),
    };

    const [total, transactions, totalPaidAggregate, customer] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (validPage - 1) * validPerPage,
        take: validPerPage,
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount_cents: true },
      }),
      prisma.customer.findUnique({
        where: { id },
        select: { current_debt_cents: true },
      }),
    ]);

    const data: Transaction[] = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type as Transaction["type"],
      amount_cents: transaction.amount_cents,
      sale_id: transaction.sale_id,
      customer_id: transaction.customer_id,
      cash_register_id: transaction.cash_register_id,
      operator_id: transaction.operator_id,
      debt_before_cents: transaction.debt_before_cents,
      description: transaction.description,
      created_at: transaction.created_at.toISOString(),
    }));

    const totalPages = Math.ceil(total / validPerPage);

    return {
      data,
      pagination: {
        page: validPage,
        per_page: validPerPage,
        total,
        total_pages: totalPages,
      },
      summary: {
        total_paid_period_cents: totalPaidAggregate._sum.amount_cents ?? 0,
        fiado_open_cents: customer?.current_debt_cents ?? 0,
      },
    };
  }

  async create(data: {
    name: string;
    phone?: string;
    email?: string;
    credit_limit_cents: number;
    payment_due_day?: number;
    is_active?: boolean;
  }) {
    return prisma.customer.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.customer.update({ where: { id }, data });
  }

  async updateDebt(id: string, debtCents: number) {
    return prisma.customer.update({
      where: { id },
      data: {
        current_debt_cents: debtCents,
        ...(debtCents === 0 && { credit_blocked: false, is_active: true }),
      },
    });
  }

  async softDelete(id: string) {
    return prisma.customer.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async checkAndDeactivateOverdueCustomers() {
    const today = new Date();
    const currentDay = today.getDate();

    return prisma.customer.updateMany({
      where: {
        deleted_at: null,
        is_active: true,
        current_debt_cents: { gt: 0 },
        payment_due_day: { not: null, lt: currentDay },
      },
      data: { is_active: false },
    });
  }
}
