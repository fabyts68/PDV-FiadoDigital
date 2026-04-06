import { prisma } from "../config/database.js";
import type { Prisma } from "@prisma/client";

export interface TransactionQueryParams {
  page: number;
  per_page: number;
  cash_register_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}

export class TransactionRepository {
  async listTransactions(params: TransactionQueryParams) {
    const where: Prisma.TransactionWhereInput = {
      ...(params.cash_register_id ? { cash_register_id: params.cash_register_id } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.start_date || params.end_date
        ? {
            created_at: {
              ...(params.start_date ? { gte: new Date(params.start_date) } : {}),
              ...(params.end_date ? { lte: new Date(params.end_date) } : {}),
            },
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: params.per_page,
        skip: (params.page - 1) * params.per_page,
      }),
    ]);

    return {
      items: data,
      pagination: {
        page: params.page,
        per_page: params.per_page,
        total,
        total_pages: Math.ceil(total / params.per_page),
      },
    };
  }
}
