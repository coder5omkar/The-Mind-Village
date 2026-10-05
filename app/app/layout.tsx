import { AppHeader } from "@/components/app-header";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/session";
import { computeStreak, levelFor } from "@/lib/stats";

export const dynamic = "force-dynamic";

// The village is open to visitors. No login required - guests get a pass.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();

  let total = 0;
  let streak = 0;
  if (viewer) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [count, dateRows] = await Promise.all([
      prisma.thought.count({ where: { userId: viewer.id } }),
      prisma.thought.findMany({
        where: { userId: viewer.id, createdAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);
    total = count;
    streak = computeStreak(dateRows.map((row) => row.createdAt));
  }

  const level = levelFor(total);

  return (
    <div className="min-h-dvh">
      <AppHeader
        user={{
          name: viewer?.name ?? "Village Visitor",
          email: viewer?.email ?? null,
          image: viewer?.image ?? null,
        }}
        isGuest={viewer?.isGuest ?? true}
        level={level}
        streak={streak}
        total={total}
      />
      <main className="w-full px-3 pb-24 pt-6 sm:px-4 sm:pt-8">{children}</main>
    </div>
  );
}
