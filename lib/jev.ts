// Jev by TypeSafe AI - typed, calibrated decisions instead of free text.
//
// Jev is NOT an OpenAI-compatible chat API. One POST sends a `state` plus
// typed `questions` (choice / score / noul) and returns typed answers with
// probabilities and a confidence value. For The Village we ask:
//   1. primary_resident   - choice over all 79 residents
//   2. secondary_resident - choice over all residents + "none"
//   3. suggested_action   - choice over increase/decrease/redirect/sleep
//   4. safety_crisis      - noul gate for self-harm language
//
// Endpoints (same request shape, different keys):
//   hosted gateway:  https://jevtypesafeai.com/api/v1/decide   (jv_live_... key)
//   official:        https://api.typesafe.ai/v1/systemone      (TypeSafe key)
//   or set JEV_API_URL to any compatible host (OpenRouter/DO/Vercel proxies).

import {
  buildReasoning,
  pickAction,
  safetyNote,
  type Prediction,
} from "./predictor";
import type { ResidentLite, SuggestedAction } from "./residents";
import { clamp } from "./utils";

const DEFAULT_HOSTED_URL = "https://jevtypesafeai.com/api/v1/decide";
const DEFAULT_OFFICIAL_URL = "https://api.typesafe.ai/v1/systemone";

const ACTIONS: SuggestedAction[] = ["increase", "decrease", "redirect", "sleep"];

export function slugifyResident(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resolveJevEndpoint(apiKey: string) {
  const override = process.env.JEV_API_URL?.trim();
  if (override) return override;
  // The self-serve hosted gateway issues jv_live_... keys.
  return apiKey.startsWith("jv_live_") ? DEFAULT_HOSTED_URL : DEFAULT_OFFICIAL_URL;
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export function buildJevRequest(thought: string, residents: ResidentLite[]) {
  const criteria: Record<string, string> = {};
  for (const resident of residents) {
    criteria[slugifyResident(resident.name)] =
      `${resident.function}; shadow: ${resident.shadow || "none listed"}`;
  }

  return {
    model: process.env.JEV_MODEL?.trim() || "jev-latest",
    state: thought,
    questions: {
      primary_resident: {
        type: "choice",
        instructions:
          "The state is a personal thought, feeling or worry someone wrote about themselves. Which resident of their inner village - a part or identity - is MOST likely speaking? Choose the single best match.",
        criteria,
      },
      secondary_resident: {
        type: "choice",
        instructions:
          "Which other resident is also active or standing right beside the primary one? Choose one, or choose none if nothing else is clearly present.",
        criteria: {
          none: "No other resident is clearly co-active",
          ...criteria,
        },
      },
      suggested_action: {
        type: "choice",
        instructions:
          "What should the person do with this resident right now? Choose the single best action.",
        criteria: {
          increase: "Let this resident lead a little more - it is helping",
          decrease: "Hear it, thank it, but turn its volume down - it is taking over",
          redirect: "Let this energy serve a different, healthier purpose",
          sleep: "This resident is tired or harmful right now - let it rest",
        },
      },
      safety_crisis: {
        type: "noul",
        instructions:
          "Does the state clearly suggest self-harm, suicide, or an immediate safety crisis? Answer true only with clear evidence.",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Response mapping (exported for tests)
// ---------------------------------------------------------------------------

type JevAnswer = {
  type?: string;
  choice?: string;
  probabilities?: Record<string, number>;
  confidence?: number;
  noul?: number;
  probability?: number;
  score?: number;
};

function extractAnswers(body: unknown): Record<string, JevAnswer> | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const nested = data.data as Record<string, unknown> | undefined;
  const result = nested?.result as Record<string, unknown> | undefined;
  const answers =
    data.answers ?? result?.answers ?? nested?.answers ?? null;
  return answers && typeof answers === "object"
    ? (answers as Record<string, JevAnswer>)
    : null;
}

function isAction(value: unknown): value is SuggestedAction {
  return (
    typeof value === "string" && ACTIONS.includes(value as SuggestedAction)
  );
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function mapJevResponse(
  body: unknown,
  residents: ResidentLite[],
  thought: string
): Prediction | null {
  const answers = extractAnswers(body);
  if (!answers) return null;

  const bySlug = new Map(
    residents.map((resident) => [slugifyResident(resident.name), resident])
  );

  const primaryAnswer = answers.primary_resident;
  const primary = primaryAnswer?.choice
    ? bySlug.get(primaryAnswer.choice)
    : undefined;
  if (!primary) return null;

  const confidence = round2(
    clamp(
      primaryAnswer.confidence ??
        primaryAnswer.probabilities?.[primaryAnswer.choice ?? ""] ??
        0.6,
      0.05,
      0.99
    )
  );

  const secondary: { name: string; confidence: number }[] = [];
  const secondaryAnswer = answers.secondary_resident;
  if (secondaryAnswer?.choice && secondaryAnswer.choice !== "none") {
    const resident = bySlug.get(secondaryAnswer.choice);
    if (resident && resident.id !== primary.id) {
      secondary.push({
        name: resident.name,
        confidence: round2(
          clamp(
            secondaryAnswer.probabilities?.[secondaryAnswer.choice] ??
              secondaryAnswer.confidence ??
              0.4,
            0.05,
            0.95
          )
        ),
      });
    }
  }

  const action = isAction(answers.suggested_action?.choice)
    ? (answers.suggested_action?.choice as SuggestedAction)
    : pickAction(primary);

  let reasoning = buildReasoning(primary, action);

  // Jev's calibrated crisis gate - stronger than keyword matching alone.
  const crisis =
    answers.safety_crisis?.noul ?? answers.safety_crisis?.probability ?? 0;
  if (crisis > 0.6) {
    const note = safetyNote(thought);
    if (note) reasoning = `${reasoning} ${note}`;
  }

  return {
    primary_resident: primary.name,
    confidence,
    secondary_residents: secondary,
    neighbors: [],
    suggested_action: action,
    reasoning,
  };
}

// ---------------------------------------------------------------------------
// Call
// ---------------------------------------------------------------------------

/** Returns null when Jev is unavailable so the engine can fall back. */
export async function analyzeWithJev(
  thought: string,
  residents: ResidentLite[]
): Promise<Prediction | null> {
  const apiKey = process.env.JEV_API_KEY?.trim();
  if (!apiKey) return null;

  const endpoint = resolveJevEndpoint(apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildJevRequest(thought, residents)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[village] Jev responded ${response.status}${
          detail ? `: ${detail.slice(0, 200)}` : ""
        }`
      );
      return null;
    }

    const body = await response.json();
    const prediction = mapJevResponse(body, residents, thought);
    if (!prediction) {
      console.warn("[village] Jev returned an unmappable response.");
    }
    return prediction;
  } catch (error) {
    console.warn("[village] Jev request failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
