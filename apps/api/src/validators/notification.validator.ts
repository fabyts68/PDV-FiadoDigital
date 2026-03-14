import { z } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ROLES } from "@pdv/shared";

const VALID_ROLES = Object.values(ROLES) as [string, ...string[]];

const listNotificationsQuerySchema = z.object({
  severity: z.enum(["critical", "high", "medium", "info"]).optional(),
  read: z
    .string()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    })
    .optional(),
  search: z.string().max(100).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  (v) => !v.from_date || !v.to_date || v.from_date <= v.to_date,
  { message: "from_date deve ser menor ou igual a to_date.", path: ["from_date"] },
);

const exportNotificationsQuerySchema = z.object({
  severity: z.enum(["critical", "high", "medium", "info"]).optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
}).refine(
  (v) => !v.from_date || !v.to_date || v.from_date <= v.to_date,
  { message: "from_date deve ser menor ou igual a to_date.", path: ["from_date"] },
);

export const createNotificationSchema = z.object({
  type: z.string().min(1).max(100),
  severity: z.enum(["critical", "high", "medium", "info"]),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  meta: z.string().optional(),
  target_roles: z.array(z.enum(VALID_ROLES)).min(1),
});

export function validateListNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = listNotificationsQuerySchema.safeParse(req.query);

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

export function validateExportNotifications(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = exportNotificationsQuerySchema.safeParse(req.query);

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
