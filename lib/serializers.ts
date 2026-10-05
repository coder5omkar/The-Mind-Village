import type { Resident, Thought } from "@prisma/client";
import { parseJsonArray } from "./utils";

export function residentLite(resident: Resident) {
  return {
    id: resident.id,
    name: resident.name,
    district: resident.district,
    function: resident.function,
    shadow: resident.shadow,
    description: resident.description,
  };
}

/** One consistent thought shape for every API response. */
export function serializeThought(
  thought: Thought,
  primary?: Resident | null,
  corrected?: Resident | null
) {
  return {
    id: thought.id,
    text: thought.text,
    confidence: thought.confidence,
    suggestedAction: thought.suggestedAction,
    reasoning: thought.reasoning,
    feedback: thought.feedback,
    source: thought.source,
    createdAt: thought.createdAt.toISOString(),
    primaryResident: primary ? residentLite(primary) : null,
    correctedResident: corrected ? residentLite(corrected) : null,
    secondaryResidents: parseJsonArray<{ name: string; confidence: number }>(
      thought.secondaryResidents
    ),
    neighbors: parseJsonArray<{ id?: string; name: string; district?: string }>(
      thought.neighbors
    ),
  };
}

export type ThoughtPayload = ReturnType<typeof serializeThought>;
