import { prisma } from "../config/database.js";
import type { Prisma } from "@prisma/client";

export interface CashRegisterQueryParams {
  page: number;
  per_page: number;
  from_date?: Date;
  to_date?: Date;
  status?: "open" | "closed";
  operator_id?: string;
}

export class CashRegisterRepository {
  async findAll(params: CashRegisterQueryParams) {
    const where: Prisma.CashRegisterWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.operator_id ? { operator_id: params.operator_id } : {}),
      ...(params.from_date || params.to_date
        ? {
            opened_at: {
              ...(params.from_date ? { gte: params.from_date } : {}),
              ...(params.to_date ? { lte: params.to_date } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        orderBy: { opened_at: "desc" },
        take: params.per_page,
        skip: (params.page - 1) * params.per_page,
      }),
      prisma.cashRegister.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: params.page,
        per_page: params.per_page,
        total,
        total_pages: Math.ceil(total / params.per_page),
      },
    };
  }

  async findOpenByTerminal(terminalId: string) {
    return prisma.cashRegister.findFirst({
      where: { terminal_id: terminalId, status: "open" },
    });
  }

  async create(data: {
    terminal_id: string;
    opening_balance_cents: number;
    operator_id: string;
  }) {
    return prisma.cashRegister.create({
      data: {
        ...data,
        status: "open",
        expected_balance_cents: data.opening_balance_cents,
      },
    });
  }

  async close(id: string, closingBalanceCents: number) {
    const register = await prisma.cashRegister.findUnique({ where: { id } });

    if (!register) {
      throw new Error("Caixa não encontrado");
    }

    return prisma.cashRegister.update({
      where: { id },
      data: {
        closing_balance_cents: closingBalanceCents,
        status: "closed",
        closed_at: new Date(),
      },
    });
  }

  async cashOut(
    id: string,
    amountCents: number,
    description: string,
    operatorId: string,
  ) {
    const register = await prisma.cashRegister.findUnique({ where: { id } });

    if (!register || register.status !== "open") {
      throw new Error("Caixa não está aberto");
    }

    return prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          type: "cash_out",
          amount_cents: amountCents,
          cash_register_id: id,
          operator_id: operatorId,
          description,
        },
      });

      return tx.cashRegister.update({
        where: { id },
        data: {
          expected_balance_cents: (register.expected_balance_cents ?? register.opening_balance_cents) - amountCents,
        },
      });
    });
  }

  async cashIn(
    id: string,
    amountCents: number,
    description: string,
    operatorId: string,
  ) {
    const register = await prisma.cashRegister.findUnique({ where: { id } });

    if (!register || register.status !== "open") {
      throw new Error("Caixa não está aberto");
    }

    return prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          type: "cash_in",
          amount_cents: amountCents,
          cash_register_id: id,
          operator_id: operatorId,
          description,
        },
      });

      return tx.cashRegister.update({
        where: { id },
        data: {
          expected_balance_cents: (register.expected_balance_cents ?? register.opening_balance_cents) + amountCents,
        },
      });
    });
  }
}
