import type { Resident } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DISTRICT_ORDER } from "@/lib/residents";
import { requireViewer } from "@/lib/session";
import { accuracyFrom, computeStreak, levelFor } from "@/lib/stats";

export const dynamic = "force-dynamic";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

// GET /api/analytics - top residents, accuracy, power trends, streak.
export async function GET() {
  const user = await requireViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [allThoughts, weekThoughts, feedbackRows, powerRows, dateRows] =
    await Promise.all([
      prisma.thought.findMany({
        where: { userId: user.id },
        select: {
          primaryResidentId: true,
          primaryResident: { select: { district: true } },
        },
      }),
      prisma.thought.findMany({
        where: { userId: user.id, createdAt: { gte: weekAgo } },
        include: { primaryResident: true },
      }),
      prisma.thought.findMany({
        where: { userId: user.id, feedback: { not: null } },
        select: { feedback: true },
      }),
      prisma.residentPower.findMany({
        where: { userId: user.id, date: { gte: windowStart } },
        include: { resident: true },
      }),
      prisma.thought.findMany({
        where: { userId: user.id, createdAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

  const total = allThoughts.length;

  // All-time mentions (used to choose which residents to plot).
  const allCounts = new Map<string, number>();
  const districtCounts = new Map<string, number>();
  for (const thought of allThoughts) {
    if (thought.primaryResidentId) {
      allCounts.set(
        thought.primaryResidentId,
        (allCounts.get(thought.primaryResidentId) ?? 0) + 1
      );
    }
    const district = thought.primaryResident?.district;
    if (district) {
      districtCounts.set(district, (districtCounts.get(district) ?? 0) + 1);
    }
  }

  // Top 5 this week.
  const weekCounts = new Map<string, { count: number; resident: Resident }>();
  for (const thought of weekThoughts) {
    if (!thought.primaryResident) continue;
    const entry = weekCounts.get(thought.primaryResident.id) ?? {
      count: 0,
      resident: thought.primaryResident,
    };
    entry.count += 1;
    weekCounts.set(thought.primaryResident.id, entry);
  }
  const topThisWeek = Array.from(weekCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((entry) => ({
      id: entry.resident.id,
      name: entry.resident.name,
      district: entry.resident.district,
      count: entry.count,
    }));

  // Power trends over the last 14 days for the 5 most frequent residents.
  const topIds = Array.from(allCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const trendResidents = topIds.length
    ? await prisma.resident.findMany({ where: { id: { in: topIds } } })
    : [];

  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  }

  const series = trendResidents.map((resident) => ({
    id: resident.id,
    name: resident.name,
    district: resident.district,
    values: days.map((): number | null => null),
  }));
  const seriesById = new Map(series.map((s) => [s.id, s]));
  for (const row of powerRows) {
    const target = seriesById.get(row.residentId);
    if (!target) continue;
    const index = days.indexOf(row.date.toISOString().slice(0, 10));
    if (index >= 0) target.values[index] = round2(row.power);
  }

  return NextResponse.json({
    stats: {
      total,
      ...levelFor(total),
      streak: computeStreak(dateRows.map((row) => row.createdAt)),
    },
    accuracy: accuracyFrom(feedbackRows.map((row) => row.feedback)),
    topThisWeek,
    trends: { days, series },
    districtBreakdown: DISTRICT_ORDER.map((district) => ({
      district,
      count: districtCounts.get(district) ?? 0,
    })),
  });
}
