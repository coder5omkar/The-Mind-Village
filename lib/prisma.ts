import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// With engineType "client", Prisma always needs a driver adapter:
// - Cloudflare Workers -> Neon serverless driver (WebSocket/HTTP)
// - Node (local dev, scripts) -> node-postgres over TCP
// The runtime check keeps the Workers path free of Node-only drivers.

const isCloudflareWorkers =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (isCloudflareWorkers) {
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString }),
      log:
        process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
