import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

// Prevent creating new PrismaClient instances on every reload in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


// Ensure default tenant exists for schemas that enforce Tenant relations.
// This prevents FK errors when tenantId uses the @default("default") value.
(async () => {
  try {
    // @ts-ignore - tenant model may not exist in some builds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyPrisma: any = prisma as any;
    if (anyPrisma.tenant?.upsert) {
      await anyPrisma.tenant.upsert({
        where: { tenantId: "default" },
        update: {},
        create: { tenantId: "default", name: "Default Tenant" },
      });
    }
  } catch (e) {
    // swallow: don't crash server on init
  }
})();

