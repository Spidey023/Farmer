// src/scripts/seedTelemetry.ts
import { PrismaClient } from "../generated/prisma"; // keep your custom path
const prisma = new PrismaClient();

function rnd(min: number, max: number, d = 1) {
  return +(Math.random() * (max - min) + min).toFixed(d);
}

async function evaluateAndRecommend(fieldId: string, snap: any) {
  const messages: string[] = [];
  if (snap.soilMoisture != null && snap.soilMoisture < 20)
    messages.push(
      `Low moisture (${snap.soilMoisture}%). Irrigate 10–15mm within 6h.`
    );
  if (snap.soilPH != null && (snap.soilPH < 5.5 || snap.soilPH > 7.5))
    messages.push(
      `Soil pH ${snap.soilPH}. Consider pH correction after soil test.`
    );
  if (snap.nitrogenLevel != null && snap.nitrogenLevel < 10)
    messages.push(
      `Low Nitrogen (${snap.nitrogenLevel}). Apply N-rich fertilizer.`
    );

  if (!messages.length) return;

  const activePlan = await prisma.fieldSeasonPlan.findFirst({
    where: { fieldId, status: "ACTIVE" },
    select: { seasonId: true, cropId: true },
    orderBy: { updatedAt: "desc" },
  });

  const season =
    activePlan?.seasonId ??
    (await prisma.season.findFirst({ orderBy: { startDate: "desc" } }))
      ?.seasonId ??
    (
      await prisma.season.create({
        data: {
          name: "OTHER",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 864e5),
        },
      })
    ).seasonId;

  const crop =
    activePlan?.cropId ??
    (await prisma.crop.findFirst())?.cropId ??
    (
      await prisma.crop.create({
        data: { name: "Generic Crop", category: "OTHER" },
      })
    ).cropId;

  await prisma.recommendation.create({
    data: {
      fieldId,
      seasonId: season,
      recommendedCropId: crop,
      source: "HYBRID",
      generatedAt: new Date(),
      rationaleJson: { rules: messages, snapshotId: snap.snapshotId },
    },
  });
}

async function main() {
  // ensure at least one farmer, field, crop, season
  const farmer = await prisma.farmer.upsert({
    where: { email: "demo@farmer.app" },
    update: {},
    create: { email: "demo@farmer.app", password: "hashed", username: "demo" },
  });
  const crop = await prisma.crop.upsert({
    where: { cropId: "crop-demo-1" },
    update: {},
    create: { cropId: "crop-demo-1", name: "Wheat", category: "CEREAL" },
  });
  const season = await prisma.season.upsert({
    where: { seasonId: "season-demo-1" },
    update: {},
    create: {
      seasonId: "season-demo-1",
      name: "WINTER",
      startDate: new Date(Date.now() - 30 * 864e5),
      endDate: new Date(Date.now() + 60 * 864e5),
    },
  });
  const field = await prisma.field.upsert({
    where: { fieldId: "field-demo-1" },
    update: {},
    create: {
      fieldId: "field-demo-1",
      farmerId: farmer.farmerId,
      landType: "AGRICULTURAL",
      surveyNumber: 1001,
      acres: new prisma.Prisma.Decimal("2.50"),
      irrigationType: "DRIP",
    },
  });
  await prisma.fieldSeasonPlan.upsert({
    where: { planId: "plan-demo-1" },
    update: { status: "ACTIVE" },
    create: {
      planId: "plan-demo-1",
      fieldId: field.fieldId,
      seasonId: season.seasonId,
      cropId: crop.cropId,
      status: "ACTIVE",
      cropStatus: "SOWN",
    },
  });

  // backfill every 3 hours for last 7 days
  const start = Date.now() - 7 * 864e5;
  for (let t = start; t <= Date.now(); t += 3 * 3600e3) {
    const snap = await prisma.fieldSnapshot.create({
      data: {
        fieldId: field.fieldId,
        at: new Date(t),
        soilMoisture: rnd(12, 40, 1),
        soilPH: rnd(5.0, 8.0, 1),
        soilTemp: rnd(15, 38, 1),
        nitrogenLevel: rnd(5, 20, 1),
        phosphorusLevel: rnd(2, 12, 1),
        potassiumLevel: rnd(2, 12, 1),
        notes: "seeded",
      },
    });
    await evaluateAndRecommend(field.fieldId, snap);
  }

  console.log("✅ Seeded telemetry & recommendations for field", field.fieldId);
}

main().finally(() => prisma.$disconnect());
