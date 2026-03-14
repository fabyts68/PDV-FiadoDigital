import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import {
  getPixKeyValidationMessage,
  isPixKeyValidByType,
  normalizePixKeyByType,
  PIX_KEY_TYPES,
  type PixKeyType,
} from "../utils/pix-key.js";

const updatePixSettingsSchema = z
  .object({
    pix_key_type: z.enum(PIX_KEY_TYPES, {
      message: "Selecione um tipo de chave Pix válido.",
    }),
    pix_key: z.string().trim().min(1, "Chave Pix é obrigatória."),
    merchant_name: z
      .string()
      .trim()
      .min(1, "Nome do recebedor é obrigatório.")
      .max(25, "Nome do recebedor deve ter no máximo 25 caracteres."),
    merchant_city: z
      .string()
      .trim()
      .min(1, "Cidade é obrigatória.")
      .max(15, "Cidade deve ter no máximo 15 caracteres."),
    password: z
      .string()
      .min(1, "Senha é obrigatória.")
      .max(128, "Senha inválida."),
  })
  .superRefine((data, context) => {
    const isValid = isPixKeyValidByType(data.pix_key_type, data.pix_key);

    if (isValid) {
      return;
    }

    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pix_key"],
      message: getPixKeyValidationMessage(data.pix_key_type),
    });
  })
  .transform((data) => ({
    ...data,
    pix_key: normalizePixKeyByType(data.pix_key_type as PixKeyType, data.pix_key),
    merchant_name: data.merchant_name.trim(),
    merchant_city: data.merchant_city.trim(),
    password: data.password,
  }));

export function validateUpdatePixSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = updatePixSettingsSchema.safeParse(req.body);

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

const updateGeneralSettingsSchema = z
  .object({
    discount_limit_daily: z.number().int().nonnegative().optional(),
    discount_limit_weekly: z.number().int().nonnegative().optional(),
    discount_limit_monthly: z.number().int().nonnegative().optional(),
    store_name: z.string().trim().max(120).optional(),
    store_cnpj: z.string().trim().max(18).optional(),
    store_address: z.string().trim().max(180).optional(),
    store_phone: z.string().trim().max(20).optional(),
    receipt_footer: z.string().trim().max(255).optional(),
    fiado_max_days: z.number().int().nonnegative().max(3650).optional(),
    fiado_allow_inactive: z.boolean().optional(),
    fiado_blocked_message: z.string().trim().max(255).optional(),
    stock_alert_min_units: z.number().int().nonnegative().optional(),
    stock_alert_min_bulk_kg: z
      .number()
      .nonnegative()
      .refine((value) => Number.isInteger(value * 1000), {
        message: "Informe no máximo 3 casas decimais para estoque a granel.",
      })
      .optional(),
    cash_register_alert_amount_cents: z.number().int().nonnegative().optional(),
    refund_alert_limit_cents: z.number().int().nonnegative().optional(),
    fiado_alert_at_90_percent: z.boolean().optional(),
    fiado_alert_on_due_day: z.boolean().optional(),
  })
  .passthrough()
  .superRefine((data, context) => {
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith("stock_alert_type_")) {
        continue;
      }

      if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "Limite por tipo de produto deve ser um número não-negativo.",
        });
      }
    }
  })
  .transform((data) => {
    const stockAlertTypeSettings: Record<string, number> = {};

    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith("stock_alert_type_")) {
        continue;
      }

      if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
        continue;
      }

      stockAlertTypeSettings[key] = value;
    }

    return {
      discount_limit_daily: data.discount_limit_daily,
      discount_limit_weekly: data.discount_limit_weekly,
      discount_limit_monthly: data.discount_limit_monthly,
      store_name: data.store_name,
      store_cnpj: data.store_cnpj,
      store_address: data.store_address,
      store_phone: data.store_phone,
      receipt_footer: data.receipt_footer,
      fiado_max_days: data.fiado_max_days,
      fiado_allow_inactive: data.fiado_allow_inactive,
      fiado_blocked_message: data.fiado_blocked_message,
      stock_alert_min_units: data.stock_alert_min_units,
      stock_alert_min_bulk_kg: data.stock_alert_min_bulk_kg,
      cash_register_alert_amount_cents: data.cash_register_alert_amount_cents,
      refund_alert_limit_cents: data.refund_alert_limit_cents,
      fiado_alert_at_90_percent: data.fiado_alert_at_90_percent,
      fiado_alert_on_due_day: data.fiado_alert_on_due_day,
      stock_alert_type_settings: stockAlertTypeSettings,
    };
  })
  .refine(
    (data) =>
      data.discount_limit_daily !== undefined ||
      data.discount_limit_weekly !== undefined ||
      data.discount_limit_monthly !== undefined ||
      data.store_name !== undefined ||
      data.store_cnpj !== undefined ||
      data.store_address !== undefined ||
      data.store_phone !== undefined ||
      data.receipt_footer !== undefined ||
      data.fiado_max_days !== undefined ||
      data.fiado_allow_inactive !== undefined ||
      data.fiado_blocked_message !== undefined ||
      data.stock_alert_min_units !== undefined ||
      data.stock_alert_min_bulk_kg !== undefined ||
      data.cash_register_alert_amount_cents !== undefined ||
      data.refund_alert_limit_cents !== undefined ||
      data.fiado_alert_at_90_percent !== undefined ||
      data.fiado_alert_on_due_day !== undefined ||
      Object.keys(data.stock_alert_type_settings).length > 0,
    {
      message: "Informe ao menos um limite para atualização.",
      path: ["discount_limit_daily"],
    },
  );

export function validateUpdateGeneralSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = updateGeneralSettingsSchema.safeParse(req.body);

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