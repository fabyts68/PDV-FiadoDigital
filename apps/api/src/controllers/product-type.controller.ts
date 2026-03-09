import type { NextFunction, Request, Response } from "express";
import { ProductTypeService } from "../services/product-type.service.js";

const productTypeService = new ProductTypeService();

export class ProductTypeController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productTypes = await productTypeService.list();
      res.json({ success: true, data: productTypes });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productType = await productTypeService.create(req.body);
      res.status(201).json({ success: true, data: productType });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productType = await productTypeService.update(req.params.id as string, req.body);
      res.json({ success: true, data: productType });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productTypeService.deactivate(req.params.id as string);
      res.json({ success: true, message: "Tipo de produto desativado" });
    } catch (error) {
      next(error);
    }
  }
}
