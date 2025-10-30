import {
  PrismaClient,
  Prisma,
  CropCategory,
  SeasonType,
  ProductCategory,
} from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // --- Crops
  await prisma.crop.createMany({
    data: [
      {
        name: "Wheat",
        category: CropCategory.CEREAL,
        defaultYieldPerAcre: new Prisma.Decimal("2.8"),
        defaultCostPerAcre: new Prisma.Decimal("18000"),
        durationDays: 110,
      },
      {
        name: "Rice",
        category: CropCategory.CEREAL,
        defaultYieldPerAcre: new Prisma.Decimal("3.5"),
        defaultCostPerAcre: new Prisma.Decimal("22000"),
        durationDays: 120,
      },
      {
        name: "Tomato",
        category: CropCategory.VEGETABLE,
        defaultYieldPerAcre: new Prisma.Decimal("9.0"),
        defaultCostPerAcre: new Prisma.Decimal("34000"),
        durationDays: 90,
      },
    ],
    skipDuplicates: true,
  });

  // --- Seasons
  await prisma.season.upsert({
    where: { seasonId: "KHARIF_2025" },
    create: {
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
        name: "Hybrid Wheat Seeds 5kg",
        category: ProductCategory.SEEDS,
        unit: "bag",
        price: new Prisma.Decimal("2499"),
        stock: 100,
      },
      {
        name: "NPK 20-20-20 Fertilizer",
        category: ProductCategory.FERTILIZER,
        unit: "kg",
        price: new Prisma.Decimal("45"),
        stock: 1000,
      },
      {
        name: "Drip Kit (0.5 acre)",
        category: ProductCategory.IRRIGATION,
        unit: "kit",
        price: new Prisma.Decimal("7999"),
        stock: 50,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Admin seed complete: crops, seasons, products.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
