import { z } from "zod";

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  cash_register_id: z.string().trim().min(1).optional(),
  type: z.enum(["sale", "refund", "cancellation", "cash_in", "cash_out", "fiado_payment"]).optional(),
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
});
