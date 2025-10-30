import { PrismaClient, RecommendationSource } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const field = await prisma.field.findFirst();
  if (!field) throw new Error("No Field found. Create a field first.");

  // choose most recent season (or hardcode one)
  const season = await prisma.season.findFirst({
    orderBy: { startDate: "desc" },
  });
  if (!season) throw new Error("No Season found. Seed seasons first.");

  // pick a crop (or hardcode by name)
  const crop = await prisma.crop.findFirst({ orderBy: { createdAt: "desc" } });
  if (!crop) throw new Error("No Crop found. Seed crops first.");

  await prisma.recommendation.create({
    data: {
      fieldId: field.fieldId,
      seasonId: season.seasonId,
      recommendedCropId: crop.cropId,
      rationaleJson: {
        reason: "Moisture & pH trend match this crop",
        features: {
          avgMoisture30d: "~22%",
          avgPH30d: "~6.5",
          irrigation: field.irrigationType,
          soil: field.soilType,
          region: field.region ?? null,
        },
        score: 0.84,
      } as any,
      generatedAt: new Date(),
      source: RecommendationSource.AI, // or "EXPERT" / "HYBRID"
    },
  });

  console.log(`✅ Seeded 1 recommendation for field ${field.fieldId}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
