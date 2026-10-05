import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { residentLite, serializeThought } from "@/lib/serializers";
import { requireViewer } from "@/lib/session";
import { computeStreak, levelFor } from "@/lib/stats";
import { parseJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

// GET /api/village - the living map: resident power, recent thoughts, edges.
export async function GET() {
  const user = await requireViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const [residents, bondThoughts, recentThoughts, powerRows, weekThoughts, dateRows] =
    await Promise.all([
      prisma.resident.findMany({ orderBy: { name: "asc" } }),
      // Bonds are personal: they only exist where the user agreed with a
      // surrounding resident in one of their readings.
      prisma.thought.findMany({
        where: { userId: user.id, primaryResidentId: { not: null } },
        select: { primaryResidentId: true, neighbors: true },
      }),
      prisma.thought.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { primaryResident: true },
      }),
      prisma.residentPower.findMany({
        where: { userId: user.id, date: { gte: sevenDaysAgo } },
      }),
      prisma.thought.findMany({
        where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
        select: { primaryResidentId: true },
      }),
      prisma.thought.findMany({
        where: { userId: user.id, createdAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

  // Build the user's custom village graph from agreed surrounders.
  const bondCounts = new Map<string, number>();
  for (const thought of bondThoughts) {
    if (!thought.primaryResidentId) continue;
    const entries = parseJsonArray<{ id?: string; status?: string }>(
      thought.neighbors
    );
    for (const entry of entries) {
      if (entry.status !== "agreed" || !entry.id) continue;
      const [a, b] = [thought.primaryResidentId, entry.id].sort();
      const key = `${a}::${b}`;
      bondCounts.set(key, (bondCounts.get(key) ?? 0) + 1);
    }
  }
  const edges = Array.from(bondCounts.entries()).map(([key, count]) => {
    const [residentAId, residentBId] = key.split("::");
    return {
      id: `bond-${key}`,
      residentAId,
      residentBId,
      strength: Math.min(0.95, 0.5 + (count - 1) * 0.15),
    };
  });

  const total = await prisma.thought.count({ where: { userId: user.id } });

  // Mentions in the last 7 days.
  const mentions = new Map<string, number>();
  for (const thought of weekThoughts) {
    if (!thought.primaryResidentId) continue;
    mentions.set(
      thought.primaryResidentId,
      (mentions.get(thought.primaryResidentId) ?? 0) + 1
    );
  }

  // Stored power averages over the week.
  const powerAgg = new Map<string, { sum: number; count: number }>();
  for (const row of powerRows) {
    const entry = powerAgg.get(row.residentId) ?? { sum: 0, count: 0 };
    entry.sum += row.power;
    entry.count += 1;
    powerAgg.set(row.residentId, entry);
  }

  const nodes = residents.map((resident) => {
    const agg = powerAgg.get(resident.id);
    const mentionCount = mentions.get(resident.id) ?? 0;
    const stored = agg ? agg.sum / agg.count : null;
    // Every resident starts at 0 power. Conversation charges them; feedback
    // and repeated mentions keep them charged.
    const power =
      stored != null
        ? Math.min(1, stored + mentionCount * 0.04)
        : Math.min(0.6, mentionCount * 0.06);
    return {
      ...residentLite(resident),
      power: round2(power),
      mentions: mentionCount,
      active: mentionCount > 0,
    };
  });

  return NextResponse.json({
    nodes,
    edges,
    thoughts: recentThoughts.map((thought) =>
      serializeThought(thought, thought.primaryResident, null)
    ),
    stats: {
      total,
      ...levelFor(total),
      streak: computeStreak(dateRows.map((row) => row.createdAt)),
      activeResidents: nodes.filter((node) => node.active).length,
    },
  });
}
