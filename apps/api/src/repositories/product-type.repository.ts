import { prisma } from "../config/database.js";
import type { CreateProductTypePayload, UpdateProductTypePayload } from "@pdv/shared";

export class ProductTypeRepository {
  async findAll() {
    return prisma.productType.findMany({
      where: { deleted_at: null },
      orderBy: { name: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.productType.findFirst({
      where: { id, deleted_at: null },
    });
  }

  async findByName(name: string) {
    return prisma.productType.findFirst({
      where: {
        name,
        deleted_at: null,
      },
    });
  }

  async create(data: CreateProductTypePayload) {
    return prisma.productType.create({ data });
  }

  async update(id: string, data: UpdateProductTypePayload) {
    return prisma.productType.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.productType.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
