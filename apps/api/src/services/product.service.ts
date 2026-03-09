import { ProductRepository } from "../repositories/product.repository.js";
import type { CreateProductPayload, UpdateProductPayload } from "@pdv/shared";
import { ProductTypeRepository } from "../repositories/product-type.repository.js";
import { BrandRepository } from "../repositories/brand.repository.js";

const productRepository = new ProductRepository();
const productTypeRepository = new ProductTypeRepository();
const brandRepository = new BrandRepository();

type BulkPricePayload = {
  product_type_id: string;
  brand_id?: string;
  profit_margin_percentage: number;
};

export class ProductService {
  async list(barcode?: string) {
    return productRepository.findAll(barcode);
  }

  async getById(id: string) {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    return product;
  }

  async create(payload: CreateProductPayload) {
    if (payload.barcode) {
      const existingByBarcode = await productRepository.findByBarcode(payload.barcode);

      if (existingByBarcode) {
        throw new Error("Código de barras já existe");
      }
    }

    if (payload.product_type_id) {
      const productType = await productTypeRepository.findById(payload.product_type_id);

      if (!productType) {
        throw new Error("Tipo de produto não encontrado");
      }
    }

    if (payload.brand_id) {
      const brand = await brandRepository.findById(payload.brand_id);

      if (!brand) {
        throw new Error("Marca não encontrada");
      }
    }

    if (typeof payload.profit_margin === "number") {
      if (payload.profit_margin <= 0 || payload.profit_margin >= 1) {
        throw new Error("Margem de lucro deve estar entre 0 e 1");
      }
    }

    return productRepository.create(payload);
  }

  async update(id: string, payload: UpdateProductPayload) {
    if (payload.barcode) {
      const existingByBarcode = await productRepository.findByBarcode(payload.barcode);

      if (existingByBarcode && existingByBarcode.id !== id) {
        throw new Error("Código de barras já existe");
      }
    }

    if (payload.product_type_id) {
      const productType = await productTypeRepository.findById(payload.product_type_id);

      if (!productType) {
        throw new Error("Tipo de produto não encontrado");
      }
    }

    if (payload.brand_id) {
      const brand = await brandRepository.findById(payload.brand_id);

      if (!brand) {
        throw new Error("Marca não encontrada");
      }
    }

    if (typeof payload.profit_margin === "number") {
      if (payload.profit_margin <= 0 || payload.profit_margin >= 1) {
        throw new Error("Margem de lucro deve estar entre 0 e 1");
      }
    }

    return productRepository.update(id, payload);
  }

  async bulkUpdatePrice(payload: BulkPricePayload) {
    const productType = await productTypeRepository.findById(payload.product_type_id);

    if (!productType) {
      throw new Error("Tipo de produto não encontrado");
    }

    if (payload.brand_id) {
      const brand = await brandRepository.findById(payload.brand_id);

      if (!brand) {
        throw new Error("Marca não encontrada");
      }
    }

    const profitMargin = payload.profit_margin_percentage / 100;

    if (profitMargin <= 0 || profitMargin >= 1) {
      throw new Error("Margem de lucro deve estar entre 1% e 99%");
    }

    const products = await productRepository.findForBulkPricing(payload.product_type_id, payload.brand_id);

    if (products.length === 0) {
      return { updated_count: 0 };
    }

    for (const product of products) {
      const calculatedPrice = Math.round(product.cost_price_cents / (1 - profitMargin));
      await productRepository.updatePricing(product.id, calculatedPrice, profitMargin);
    }

    return { updated_count: products.length };
  }

  async deactivate(id: string) {
    return productRepository.softDelete(id);
  }
}
