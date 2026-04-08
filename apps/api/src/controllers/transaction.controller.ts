import type { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/transaction.service.js";
import { listTransactionsQuerySchema } from "../validators/transaction.validator.js";

const transactionService = new TransactionService();

export class TransactionController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listTransactionsQuerySchema.parse(req.query);

      const result = await transactionService.listTransactions({
        page: query.page,
        per_page: query.per_page,
        cash_register_id: query.cash_register_id,
        type: query.type,
        start_date: query.start_date,
        end_date: query.end_date,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
