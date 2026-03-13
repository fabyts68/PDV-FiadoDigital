import type { Request, Response, NextFunction } from "express";
import { CustomerService } from "../services/customer.service.js";
import type { CustomerQueryParams } from "@pdv/shared";

const customerService = new CustomerService();

function parsePositiveQueryNumber(rawValue: unknown): number | undefined {
  if (typeof rawValue === "number") {
    if (!Number.isFinite(rawValue) || rawValue <= 0) {
      return undefined;
    }

    return Math.trunc(rawValue);
  }

  if (typeof rawValue !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function parseSortBy(value: unknown): CustomerQueryParams["sort_by"] {
  const allowedValues: Array<NonNullable<CustomerQueryParams["sort_by"]>> = [
    "name",
    "credit_limit_cents",
    "current_debt_cents",
    "payment_due_day",
    "is_active",
  ];

  if (typeof value !== "string") {
    return undefined;
  }

  if (allowedValues.includes(value as NonNullable<CustomerQueryParams["sort_by"]>)) {
    return value as NonNullable<CustomerQueryParams["sort_by"]>;
  }

  return undefined;
}

function parseSortOrder(value: unknown): CustomerQueryParams["sort_order"] {
  if (value === "desc") {
    return "desc";
  }

  return "asc";
}

export class CustomerController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
      const onlyActive = req.query.only_active === "true";
      const page = parsePositiveQueryNumber(req.query.page) ?? 1;
      const perPage = parsePositiveQueryNumber(req.query.per_page) ?? 10;
      const sortBy = parseSortBy(req.query.sort_by);
      const sortOrder = parseSortOrder(req.query.sort_order);

      const result = await customerService.list({
        search,
        only_active: onlyActive,
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const customer = await customerService.getById(req.params.id as string);
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async getFiadoHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.params.id as string;
      const page = parsePositiveQueryNumber(req.query.page) ?? 1;
      const perPage = parsePositiveQueryNumber(req.query.per_page) ?? 10;
      const month = parsePositiveQueryNumber(req.query.month);
      const year = parsePositiveQueryNumber(req.query.year);

      const validMonth = month && month >= 1 && month <= 12 ? month : undefined;
      const validYear = year && year >= 2000 && year <= 9999 ? year : undefined;

      const result = await customerService.getFiadoHistory(customerId, page, perPage, {
        month: validMonth,
        year: validYear,
      });
      res.json({ success: true, data: result.data, pagination: result.pagination, summary: result.summary });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.params.id as string;
      const page = parsePositiveQueryNumber(req.query.page) ?? 1;
      const perPage = parsePositiveQueryNumber(req.query.per_page) ?? 10;
      const month = parsePositiveQueryNumber(req.query.month);
      const year = parsePositiveQueryNumber(req.query.year);

      const validMonth = month && month >= 1 && month <= 12 ? month : undefined;
      const validYear = year && year >= 2000 && year <= 9999 ? year : undefined;

      const result = await customerService.getPaymentHistory(customerId, page, perPage, {
        month: validMonth,
        year: validYear,
      });

      res.json({ success: true, data: result.data, pagination: result.pagination, summary: result.summary });
    } catch (error) {
      next(error);
    }
  }

  async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const customer = await customerService.create(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const customer = await customerService.update(req.params.id as string, req.body);
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await customerService.deactivate(req.params.id as string);
      res.json({ success: true, message: "Cliente desativado" });
    } catch (error) {
      next(error);
    }
  }

  async payDebt(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { amount_cents, pin } = req.body;
      const customerId = req.params.id as string;
      const operatorId = req.user?.sub;

      if (!operatorId) {
        res.status(401).json({ success: false, message: "Usuário não autenticado" });
        return;
      }

      const customer = await customerService.payDebt(customerId, amount_cents, pin, operatorId);
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }
}
