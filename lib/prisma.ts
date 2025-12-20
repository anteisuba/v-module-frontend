// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Cache Prisma Client in global object to reuse connections
// This is especially important in serverless environments (Vercel)
// where the same container may handle multiple requests
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
