import {
  PrismaClient,
  Prisma,
  CropCategory,
  SeasonType,
  ProductCategory,
} from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // --- Default tenant
  await prisma.tenant.upsert({
    where: { tenantId: "default" },
    create: { tenantId: "default", name: "Default Tenant" },
    update: {},
  });

  // --- Admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@former.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const hash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.farmer.upsert({
    where: { email: adminEmail },
    create: {
      username: "admin",
      email: adminEmail,
      password: hash,
      fullName: "System Admin",
      tenantId: "default",
      role: "ADMIN",
      wallet: { create: { tenantId: "default", balance: new Prisma.Decimal("0") } },
    },
    update: { role: "ADMIN" },
  });

  // --- Crops
  await prisma.crop.createMany({
    data: [
      {
        tenantId: "default",
        name: "Wheat",
        category: CropCategory.CEREAL,
        defaultYieldPerAcre: new Prisma.Decimal("2.8"),
        defaultCostPerAcre: new Prisma.Decimal("18000"),
        marketPricePerUnit: new Prisma.Decimal("2200"),
        durationDays: 110,
      },
      {
        tenantId: "default",
        name: "Rice",
        category: CropCategory.CEREAL,
        defaultYieldPerAcre: new Prisma.Decimal("3.5"),
        defaultCostPerAcre: new Prisma.Decimal("22000"),
        marketPricePerUnit: new Prisma.Decimal("1800"),
        durationDays: 120,
      },
      {
        tenantId: "default",
        name: "Tomato",
        category: CropCategory.VEGETABLE,
        defaultYieldPerAcre: new Prisma.Decimal("9.0"),
        defaultCostPerAcre: new Prisma.Decimal("34000"),
        marketPricePerUnit: new Prisma.Decimal("1200"),
        durationDays: 90,
      },
    ],
    skipDuplicates: true,
  });

  // --- Seasons
  await prisma.season.upsert({
    where: { seasonId: "KHARIF_2025" },
    create: {
      tenantId: "default",
      seasonId: "KHARIF_2025",
      name: SeasonType.KHARIF,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-09-30"),
    },
    update: {},
  });

  await prisma.season.upsert({
    where: { seasonId: "RABI_2025" },
    create: {
      tenantId: "default",
      seasonId: "RABI_2025",
      name: SeasonType.RABI,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-02-28"),
    },
    update: {},
  });

  // --- Products
  await prisma.product.createMany({
    data: [
      {
        tenantId: "default",
        name: "Hybrid Wheat Seeds 5kg",
        category: ProductCategory.SEEDS,
        unit: "bag",
        price: new Prisma.Decimal("2499"),
        stock: 100,
      },
      {
        tenantId: "default",
        name: "NPK 20-20-20 Fertilizer",
        category: ProductCategory.FERTILIZER,
        unit: "kg",
        price: new Prisma.Decimal("45"),
        stock: 1000,
      },
      {
        tenantId: "default",
        name: "Drip Kit (0.5 acre)",
        category: ProductCategory.IRRIGATION,
        unit: "kit",
        price: new Prisma.Decimal("7999"),
        stock: 50,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed complete: default tenant, admin, crops, seasons, products.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
