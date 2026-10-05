import type { Resident } from "@prisma/client";
import { NextResponse } from "next/server";
import { analyzeThought } from "@/lib/engine";
import { bumpMany } from "@/lib/power";
import { prisma } from "@/lib/prisma";
import { residentLite, serializeThought } from "@/lib/serializers";
import { requireViewer } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/analyze - identify which resident is speaking in a thought.
export async function POST(req: Request) {
  const user = await requireViewer();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 3) {
    return NextResponse.json(
      { error: "Share a little more - even a few words is enough." },
      { status: 400 }
    );
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: "That thought is very long. Keep it under 4000 characters." },
      { status: 400 }
    );
  }

  const residents = await prisma.resident.findMany({
    orderBy: { district: "asc" },
  });
  const { prediction, source } = await analyzeThought(text, residents);

  const byName = new Map(residents.map((r) => [r.name, r]));
  const primary = byName.get(prediction.primary_resident) ?? residents[0];

  const secondaries = prediction.secondary_residents
    .map((s) => {
      const resident = byName.get(s.name);
      return resident && resident.id !== primary.id
        ? { name: resident.name, confidence: s.confidence, resident }
        : null;
    })
    .filter(
      (s): s is { name: string; confidence: number; resident: Resident } =>
        s !== null
    )
    .slice(0, 3);

  // Surrounding residents suggested by the engine (max 2, best scored first) -
  // the user approves each one before it becomes a bond. No predefined graph.
  const neighbors = prediction.neighbors
    .map((suggestion) => {
      const resident = byName.get(suggestion.name);
      return resident && resident.id !== primary.id
        ? {
            resident,
            confidence: suggestion.confidence,
            reason: suggestion.reason,
          }
        : null;
    })
    .filter(
      (
        entry
      ): entry is { resident: Resident; confidence: number; reason: string } =>
        entry !== null
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  const thought = await prisma.thought.create({
    data: {
      userId: user.id,
      text,
      primaryResidentId: primary.id,
      confidence: prediction.confidence,
      secondaryResidents: secondaries.map((s) => ({
        name: s.name,
        confidence: s.confidence,
      })),
      neighbors: neighbors.map((entry) => ({
        id: entry.resident.id,
        name: entry.resident.name,
        district: entry.resident.district,
        status: "pending",
        confidence: entry.confidence,
        reason: entry.reason,
      })),
      suggestedAction: prediction.suggested_action,
      reasoning: prediction.reasoning,
      source,
    },
  });

  // Activity gently charges the residents that showed up.
  await bumpMany(user.id, [
    { residentId: primary.id, delta: 0.05 },
    ...neighbors.map((entry) => ({
      residentId: entry.resident.id,
      delta: 0.02,
    })),
  ]);

  return NextResponse.json({
    thought: serializeThought(thought, primary, null),
    prediction,
    primary: residentLite(primary),
    secondary: secondaries.map((s) => ({
      name: s.name,
      confidence: s.confidence,
      resident: residentLite(s.resident),
    })),
    neighbors: neighbors.map((entry) => residentLite(entry.resident)),
    source,
  });
}
