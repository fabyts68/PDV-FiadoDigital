import type { Request, Response, NextFunction } from "express";
import { DomainError } from "../errors/domain-error.js";
import { ZodError } from "zod";
import { logError } from "../utils/logger.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (_req as any).id || (_req as any).requestId || res.locals?.requestId;
  const userId = res.locals?.user?.id;
  logError("Erro", err, { tag: "PDV API", requestId, userId });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Dados inválidos",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  const statusCode = err instanceof DomainError ? err.statusCode : 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500 ? "Erro interno" : err.message;

  res.status(statusCode).json({ success: false, message });
}
