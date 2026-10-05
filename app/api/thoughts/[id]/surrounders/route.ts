import { NextResponse } from "next/server";
import { bumpPower } from "@/lib/power";
import { prisma } from "@/lib/prisma";
import { serializeThought } from "@/lib/serializers";
import { requireViewer } from "@/lib/session";
import { parseJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

type NeighborEntry = {
  id?: string;
  name: string;
  district?: string;
  status?: string;
};

// POST /api/thoughts/:id/surrounders - agree or disagree with one of the
// surrounding residents suggested for this reading. Agreed surrounders become
// real bonds in the user's own village; nothing is predefined.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { residentId?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const residentId =
    typeof body.residentId === "string" ? body.residentId : "";
  const status = body.status;
  if (
    !residentId ||
    (status !== "agreed" && status !== "rejected" && status !== "unsure")
  ) {
    return NextResponse.json(
      { error: "Provide residentId and status: agreed | rejected | unsure." },
      { status: 400 }
    );
  }

  const thought = await prisma.thought.findUnique({
    where: { id: params.id },
    include: { primaryResident: true, userCorrectedResident: true },
  });
  if (!thought || thought.userId !== user.id) {
    return NextResponse.json({ error: "Thought not found." }, { status: 404 });
  }

  const neighbors = parseJsonArray<NeighborEntry>(thought.neighbors);
  const entry = neighbors.find((neighbor) => neighbor.id === residentId);
  if (!entry) {
    return NextResponse.json(
      { error: "That resident is not one of this reading's surrounders." },
      { status: 400 }
    );
  }

  entry.status = status;

  const updated = await prisma.thought.update({
    where: { id: thought.id },
    data: { neighbors },
  });

  // Agreeing strengthens the bond (and gently charges the primary);
  // disagreeing cools the surrounder down; "unsure" leaves everything as is.
  if (status === "agreed") {
    await bumpPower(user.id, residentId, 0.05);
    if (thought.primaryResidentId) {
      await bumpPower(user.id, thought.primaryResidentId, 0.02);
    }
  } else if (status === "rejected") {
    await bumpPower(user.id, residentId, -0.02);
  }

  return NextResponse.json({
    thought: serializeThought(
      updated,
      thought.primaryResident,
      thought.userCorrectedResident
    ),
  });
}
