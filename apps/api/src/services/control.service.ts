import { ControlRepository } from "../repositories/control.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { StockMovementService } from "./stock-movement.service.js";

const controlRepository = new ControlRepository();
const stockMovementService = new StockMovementService();
const productRepository = new ProductRepository();

export class ControlService {
  async getStockSummary(options?: {
    product_type_id?: string;
    brand_id?: string;
    page?: number;
    per_page?: number;
    sort_by?: "name" | "type" | "brand" | "stock" | "average_cost" | "stock_value";
    sort_order?: "asc" | "desc";
  }) {
    return controlRepository.getStockSummary(options);
  }

  async getStockMovements(productId: string) {
    return stockMovementService.listByProductId(productId);
  }

  async createStockAdjustment(payload: {
    product_id: string;
    quantity: number;
    unit_cost_cents: number;
    description: string;
    operator_id: string;
  }) {
    return stockMovementService.createAdjustment(payload);
  }

  async getCashSummary(startDate?: string, endDate?: string) {
    return controlRepository.getCashSummary(startDate, endDate);
  }

  async getDiscountSummary(startDate?: string, endDate?: string) {
    return controlRepository.getDiscountSummary(startDate, endDate);
  }

  async getCancellations(startDate?: string, endDate?: string) {
    return controlRepository.getCancellations(startDate, endDate, 50);
  }

  async ensureProductExists(productId: string) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    return product;
  }
}
