import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../generated/prisma";

// Prevent creating new PrismaClient instances on every reload in dev
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
