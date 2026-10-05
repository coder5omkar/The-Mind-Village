import { NextResponse } from "next/server";
import { bumpMany } from "@/lib/power";
import { prisma } from "@/lib/prisma";
import { serializeThought } from "@/lib/serializers";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

const FEEDBACK_VALUES = ["correct", "wrong", "partial"] as const;
type FeedbackValue = (typeof FEEDBACK_VALUES)[number];

// POST /api/thoughts/:id/feedback - confirm or correct a prediction.
// Adjusts ResidentPower for the day so the village learns over time.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { feedback?: unknown; correctedResidentId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const feedback = body.feedback as FeedbackValue;
  if (!FEEDBACK_VALUES.includes(feedback)) {
    return NextResponse.json(
      { error: "Feedback must be one of: correct, wrong, partial." },
      { status: 400 }
    );
  }

  const thought = await prisma.thought.findUnique({
    where: { id: params.id },
    include: { primaryResident: true },
  });
  if (!thought || thought.userId !== user.id) {
    return NextResponse.json({ error: "Thought not found." }, { status: 404 });
  }

  let correctedResidentId: string | null = null;
  let corrected = null;
  if (feedback !== "correct") {
    const candidate =
      typeof body.correctedResidentId === "string"
        ? body.correctedResidentId
        : "";
    corrected = candidate
      ? await prisma.resident.findUnique({ where: { id: candidate } })
      : null;
    if (!corrected) {
      return NextResponse.json(
        { error: "Pick which resident was actually speaking." },
        { status: 400 }
      );
    }
    correctedResidentId = corrected.id;
  }

  const updated = await prisma.thought.update({
    where: { id: thought.id },
    data: {
      feedback,
      userCorrectedResidentId: correctedResidentId,
    },
  });

  // Power adjustments - gentle and bounded between 0 and 1.
  const deltas: { residentId: string; delta: number }[] = [];
  const primaryId = thought.primaryResidentId;
  if (feedback === "correct" && primaryId) {
    deltas.push({ residentId: primaryId, delta: 0.1 });
  }
  if (feedback === "partial") {
    if (primaryId) deltas.push({ residentId: primaryId, delta: 0.02 });
    if (correctedResidentId)
      deltas.push({ residentId: correctedResidentId, delta: 0.08 });
  }
  if (feedback === "wrong") {
    if (primaryId) deltas.push({ residentId: primaryId, delta: -0.12 });
    if (correctedResidentId)
      deltas.push({ residentId: correctedResidentId, delta: 0.15 });
  }
  await bumpMany(user.id, deltas);

  return NextResponse.json({
    thought: serializeThought(updated, thought.primaryResident, corrected),
  });
}
