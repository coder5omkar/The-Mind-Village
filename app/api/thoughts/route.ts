import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeThought } from "@/lib/serializers";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/thoughts - the user's last 50 thoughts with their residents.
export async function GET() {
  const user = await requireViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thoughts = await prisma.thought.findMany({
    where: { userId: user.id },
    include: { primaryResident: true, userCorrectedResident: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    thoughts: thoughts.map((thought) =>
      serializeThought(
        thought,
        thought.primaryResident,
        thought.userCorrectedResident
      )
    ),
  });
}
