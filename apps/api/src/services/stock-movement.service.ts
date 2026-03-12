import { ProductRepository } from "../repositories/product.repository.js";
import { StockMovementRepository } from "../repositories/stock-movement.repository.js";

const stockMovementRepository = new StockMovementRepository();
const productRepository = new ProductRepository();

export class StockMovementService {
  async listByProductId(productId: string) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    return stockMovementRepository.findByProductId(productId, 20);
  }

  async createAdjustment(payload: {
    product_id: string;
    quantity: number;
    unit_cost_cents: number;
    description: string;
    operator_id: string;
  }) {
    if (!payload.operator_id) {
      throw new Error("Operador inválido");
    }

    if (!payload.product_id) {
      throw new Error("Produto é obrigatório");
    }

    if (!Number.isFinite(payload.quantity) || payload.quantity === 0) {
      throw new Error("Quantidade de ajuste inválida");
    }

    if (!Number.isInteger(payload.unit_cost_cents) || payload.unit_cost_cents < 0) {
      throw new Error("Custo unitário inválido");
    }

    if (!payload.description.trim()) {
      throw new Error("Descrição é obrigatória");
    }

    return stockMovementRepository.createAdjustment({
      ...payload,
      description: payload.description.trim(),
    });
  }
}
