import { prisma } from "./prisma";
import { clamp } from "./utils";

/** Normalize to UTC midnight so the (userId, residentId, date) unique key is stable. */
export function startOfUTCDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function clampPower(value: number) {
  return clamp(value, 0, 1);
}

/**
 * Adjust the daily power of one resident. Power is the game-like measure of how
 * much airtime a resident is getting in your village.
 */
export async function bumpPower(
  userId: string,
  residentId: string,
  delta: number
) {
  const date = startOfUTCDay();
  const existing = await prisma.residentPower.findUnique({
    where: { userId_residentId_date: { userId, residentId, date } },
  });

  if (existing) {
    return prisma.residentPower.update({
      where: { id: existing.id },
      data: { power: clampPower(existing.power + delta) },
    });
  }

  return prisma.residentPower.create({
    // Power starts at zero and only grows through conversation.
    data: { userId, residentId, date, power: clampPower(delta) },
  });
}

export async function bumpMany(
  userId: string,
  entries: { residentId: string; delta: number }[]
) {
  for (const entry of entries) {
    await bumpPower(userId, entry.residentId, entry.delta);
  }
}
