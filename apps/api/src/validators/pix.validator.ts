import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const generateQRCodeSchema = z.object({
  amount_cents: z.number().int().positive(),
  tx_id: z.string().max(25).optional(),
});

export function validateGenerateQRCode(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = generateQRCodeSchema.safeParse(req.body);

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
