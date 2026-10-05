import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// With engineType "client", Prisma always needs a driver adapter:
// - Cloudflare Workers -> Neon serverless driver (WebSocket/HTTP)
// - Node (local dev, Amplify/Lambda, scripts) -> node-postgres over TCP
//
// The client is created lazily so `next build` never requires DATABASE_URL.
// A missing configuration raises a clear error on the first query instead.

const isCloudflareWorkers =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env locally or to the hosting environment variables."
    );
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

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: the real client is created on first property access.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[
      property
    ];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
