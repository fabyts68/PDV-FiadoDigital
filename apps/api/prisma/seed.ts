import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/dev.db";
const dbPath = databaseUrl.replace("file:", "");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("admin123", 12);
  const pinHash = await bcrypt.hash("123456", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      is_active: true,
      deleted_at: null,
      pin_hash: pinHash,
    },
    create: {
      name: "Administrador",
      username: "admin",
      password_hash: passwordHash,
      pin_hash: pinHash,
      role: "admin",
      is_active: true,
    },
  });

  const saleItemsWithoutName = await prisma.saleItem.findMany({
    where: {
      OR: [
        { product_name: "" },
        { product_name: "Produto sem nome" },
      ],
    },
    select: {
      id: true,
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  for (const saleItem of saleItemsWithoutName) {
    const productName = saleItem.product.name.trim();

    if (!productName) {
      continue;
    }

    await prisma.saleItem.update({
      where: { id: saleItem.id },
      data: { product_name: productName },
    });
  }

  console.log("[SEED] Usuario admin garantido com sucesso.");
  console.log("[SEED] Login: admin | Senha: admin123");
  console.log("[SEED] PIN temporario para testes: 123456");

  if (saleItemsWithoutName.length > 0) {
    console.log(`[SEED] Snapshot de nome preenchido em ${saleItemsWithoutName.length} itens de venda.`);
  }
}

main()
  .catch((error) => {
    console.error("[SEED] Falha ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
