import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const createStockAdjustmentSchema = z.object({
  product_id: z.string().uuid("Produto inválido"),
  quantity: z.number().refine((value) => value !== 0, {
    message: "Quantidade de ajuste deve ser diferente de zero",
  }),
  unit_cost_cents: z.number().int().nonnegative(),
  description: z.string().trim().min(3, "Descrição é obrigatória"),
});

export function validateCreateStockAdjustment(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = createStockAdjustmentSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  req.body = result.data;
  next();
}
