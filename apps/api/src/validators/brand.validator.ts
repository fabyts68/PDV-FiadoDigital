import { z } from "zod";
import type { NextFunction, Request, Response } from "express";

const brandBaseSchema = z.object({
  name: z.string().min(1).max(100),
});

const createBrandSchema = brandBaseSchema;
const updateBrandSchema = brandBaseSchema.partial();

export function validateCreateBrand(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = createBrandSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  next();
}

export function validateUpdateBrand(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = updateBrandSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  next();
}