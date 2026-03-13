import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const listCashRegistersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  terminal_id: z.string().min(1).optional(),
  status: z.enum(["open", "closed"]).optional(),
  operator_id: z.string().uuid().optional(),
}).refine((data) => !data.from_date || !data.to_date || data.from_date <= data.to_date, {
  message: "from_date deve ser menor ou igual a to_date.",
  path: ["from_date"],
});

export function validateListCashRegisters(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = listCashRegistersQuerySchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  req.query = result.data as unknown as Request["query"];
  next();
}
