import { PrismaClient, Prisma, FieldQuality } from "../src/generated/prisma";

const prisma = new PrismaClient();

function jitter(base: number, spread: number) {
  return +(base + (Math.random() * 2 - 1) * spread).toFixed(2);
}

async function main() {
  // pick any existing field (or replace with where: { fieldId: "..." })
  const field = await prisma.field.findFirst();
  if (!field) throw new Error("No Field found. Create a field first.");

  const days = 30;
  const today = new Date();
  const data: Prisma.FieldSnapshotCreateManyInput[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const at = new Date(today);
    at.setDate(today.getDate() - i);

    data.push({
      fieldId: field.fieldId,
      at,
      avgMoisture: jitter(22, 6),
      lastPh: jitter(6.5, 0.6),
      soilTemp: jitter(24, 5),
      notes: i % 7 === 0 ? "Irrigation day" : null,
      quality: i % 10 === 0 ? FieldQuality.MODERATE : FieldQuality.GOOD,
      // snapshotId/createdAt/updatedAt omitted → defaults
    });
  }

  // optional: clear previous for a clean demo
  await prisma.fieldSnapshot.deleteMany({ where: { fieldId: field.fieldId } });
  await prisma.fieldSnapshot.createMany({ data });

  console.log(`✅ Seeded ${days} snapshots for field ${field.fieldId}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
