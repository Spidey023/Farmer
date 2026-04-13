import app from "./app";
import { prisma } from "./db";
import bcrypt from "bcrypt";

const port = process.env.PORT || 3000;

async function seedDefaults() {
  // Ensure default tenant exists
  await prisma.tenant.upsert({
    where: { tenantId: "default" },
    update: {},
    create: { tenantId: "default", name: "Default Tenant" },
  });

  // Seed Seasons if empty
  const seasonCount = await prisma.season.count();
  if (seasonCount === 0) {
    const now = new Date();
    const plusDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    await prisma.season.createMany({
      data: [
        { tenantId: "default", name: "RABI", startDate: now, endDate: plusDays(120) },
        { tenantId: "default", name: "KHARIF", startDate: now, endDate: plusDays(120) },
        { tenantId: "default", name: "SUMMER", startDate: now, endDate: plusDays(90) },
      ],
      skipDuplicates: true,
    });
  }

  // Seed Crops if empty
  const cropCount = await prisma.crop.count();
  if (cropCount === 0) {
    await prisma.crop.createMany({
      data: [
        { tenantId: "default", name: "WHEAT", category: "CEREAL" },
        { tenantId: "default", name: "RICE", category: "CEREAL" },
        { tenantId: "default", name: "MAIZE", category: "CEREAL" },
        { tenantId: "default", name: "TOMATO", category: "VEGETABLE" },
      ],
      skipDuplicates: true,
    });
  }

  // Seed one Admin (so you never get stuck)
  // You can override defaults via env ADMIN_EMAIL / ADMIN_PASSWORD
  const adminEmail = process.env.ADMIN_EMAIL || "admin@former.ai";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  // Username is unique in DB. Seed must be idempotent.
  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  const hashed = await bcrypt.hash(adminPassword, 10);

  // Upsert by unique username so we never crash on reboots.
  await prisma.farmer.upsert({
    where: { username: adminUsername },
    update: {
      // Keep existing user if already created, but ensure it's an ADMIN for default tenant.
      role: "ADMIN",
      tenantId: "default",
      // Update email if you changed ADMIN_EMAIL in env.
      email: adminEmail,
    },
    create: {
      tenantId: "default",
      role: "ADMIN",
      email: adminEmail,
      username: adminUsername,
      password: hashed,
    },
  });

  console.log(`Admin ready: ${adminEmail} / ${adminPassword}`);
}

seedDefaults()
  .catch((e) => console.error("Seed defaults failed:", e))
  .finally(() => {});

app.listen(port, () => {
  console.log("server is running in", port);
});
