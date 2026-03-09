import { prisma } from "../config/database.js";
import type { CreateProductPayload, UpdateProductPayload } from "@pdv/shared";

export class ProductRepository {
  async findAll(barcode?: string) {
    return prisma.product.findMany({
      where: {
        deleted_at: null,
        ...(barcode ? { barcode } : {}),
        AND: [
          {
            OR: [
              { product_type_id: null },
              { product_type: { is: { deleted_at: null } } },
            ],
          },
          {
            OR: [
              { brand_id: null },
              { brand: { is: { deleted_at: null } } },
            ],
          },
        ],
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_type: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.product.findFirst({
      where: { id, deleted_at: null },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_type: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  async findByBarcode(barcode: string) {
    return prisma.product.findFirst({
      where: { barcode, deleted_at: null },
      select: { id: true },
    });
  }

  async create(data: CreateProductPayload) {
    return prisma.product.create({
      data,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_type: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateProductPayload) {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_type: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });
  }

  async findByBrandId(brandId: string) {
    return prisma.product.findFirst({
      where: {
        brand_id: brandId,
        deleted_at: null,
      },
      select: { id: true },
    });
  }

  async findForBulkPricing(productTypeId: string, brandId?: string) {
    return prisma.product.findMany({
      where: {
        deleted_at: null,
        product_type_id: productTypeId,
        ...(brandId ? { brand_id: brandId } : {}),
      },
      select: {
        id: true,
        cost_price_cents: true,
      },
    });
  }

  async updatePricing(id: string, priceCents: number, profitMargin: number) {
    return prisma.product.update({
      where: { id },
      data: {
        price_cents: priceCents,
        profit_margin: profitMargin,
      },
    });
  }

  async softDelete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
