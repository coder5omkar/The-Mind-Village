// Jev by TypeSafe AI - typed, calibrated decisions instead of free text.
//
// Jev is NOT an OpenAI-compatible chat API. One POST sends a `state` plus
// typed `questions` (choice / score / noul) and returns typed answers with
// probabilities and a confidence value. For The Village we ask:
//   1. primary_resident    - choice over all 79 residents
//   2. surrounding_1 .. 4  - four nearby residents, always chosen
//   3. suggested_action    - choice over increase/decrease/redirect/sleep
//   4. safety_crisis       - noul gate for self-harm language
// If the four surrounding slots repeat residents, a second "fill" call
// excludes the already-picked names until four distinct ones are found.
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

function buildCriteria(residents: ResidentLite[]) {
  const criteria: Record<string, string> = {};
  for (const resident of residents) {
    criteria[slugifyResident(resident.name)] =
      `${resident.function}; shadow: ${resident.shadow || "none listed"}`;
  }
  return criteria;
}

export function buildJevRequest(thought: string, residents: ResidentLite[]) {
  const criteria = buildCriteria(residents);

  // Surrounding residents: four distinct angles. Jev must always choose one
  // for each slot - the user approves or rejects them, so a weak suggestion is
  // fine and can simply be disagreed with.
  const surroundCriteria = criteria;

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
      surrounding_1: {
        type: "choice",
        instructions:
          "Which resident stands closest to the primary one - the most likely co-active neighbor? Always choose the single best resident.",
        criteria: surroundCriteria,
      },
      surrounding_2: {
        type: "choice",
        instructions:
          "Which other resident is often pulled in when the primary one speaks? Choose a different resident than the closest neighbor. Always choose one.",
        criteria: surroundCriteria,
      },
      surrounding_3: {
        type: "choice",
        instructions:
          "Which resident pushes, provokes or competes with the primary one? Always choose one.",
        criteria: surroundCriteria,
      },
      surrounding_4: {
        type: "choice",
        instructions:
          "Which resident calms, protects or balances the primary one? Always choose one.",
        criteria: surroundCriteria,
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

export function buildJevFillRequest(
  thought: string,
  residents: ResidentLite[],
  excludedNames: string[]
) {
  const criteria = buildCriteria(residents);
  const exclusion =
    excludedNames.length > 0
      ? ` Do NOT choose any of these residents: ${excludedNames.join(", ")}.`
      : "";
  const ask = (angle: string) =>
    `${angle}${exclusion} Always choose one resident that is not excluded.`;

  return {
    model: process.env.JEV_MODEL?.trim() || "jev-latest",
    state: thought,
    questions: {
      fill_1: {
        type: "choice",
        instructions: ask(
          "Which resident is often active together with the primary one?"
        ),
        criteria,
      },
      fill_2: {
        type: "choice",
        instructions: ask(
          "Which resident quietly influences the primary one from the background?"
        ),
        criteria,
      },
      fill_3: {
        type: "choice",
        instructions: ask(
          "Which resident sits on the opposite side - the one the primary pushes against or learns from?"
        ),
        criteria,
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

/** Pull distinct surrounder names out of any Jev body (primary or fill pass). */
function collectSurrounderNames(
  body: unknown,
  residents: ResidentLite[],
  excludedSlugs: Set<string>,
  excludedNames: Set<string>
) {
  const answers = extractAnswers(body);
  if (!answers) return [];
  const bySlug = new Map(
    residents.map((resident) => [slugifyResident(resident.name), resident])
  );
  const names: string[] = [];
  for (const key of Object.keys(answers)) {
    if (!key.startsWith("surrounding") && !key.startsWith("fill")) continue;
    const choice = answers[key]?.choice;
    if (!choice || choice === "none") continue;
    const resident = bySlug.get(choice);
    if (!resident) continue;
    if (excludedSlugs.has(choice) || excludedNames.has(resident.name)) continue;
    if (!names.includes(resident.name)) names.push(resident.name);
  }
  return names;
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

  // Surrounding residents: deduped, never the primary itself.
  const neighborNames = collectSurrounderNames(
    body,
    residents,
    new Set([primaryAnswer.choice ?? ""]),
    new Set([primary.name])
  );

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
    neighbors: neighborNames,
    suggested_action: action,
    reasoning,
  };
}

// ---------------------------------------------------------------------------
// Call
// ---------------------------------------------------------------------------

async function callJev(payload: unknown, endpoint: string, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

    return await response.json();
  } catch (error) {
    console.warn("[village] Jev request failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Returns null when Jev is unavailable so the engine can fall back. */
export async function analyzeWithJev(
  thought: string,
  residents: ResidentLite[]
): Promise<Prediction | null> {
  const apiKey = process.env.JEV_API_KEY?.trim();
  if (!apiKey) return null;
  const endpoint = resolveJevEndpoint(apiKey);

  const body = await callJev(
    buildJevRequest(thought, residents),
    endpoint,
    apiKey
  );
  if (!body) return null;

  const prediction = mapJevResponse(body, residents, thought);
  if (!prediction) {
    console.warn("[village] Jev returned an unmappable response.");
    return null;
  }

  // The four surrounding questions are evaluated in parallel, so Jev can
  // repeat the same resident. Follow-up "fill" calls explicitly exclude the
  // already chosen names until the circle has four distinct residents.
  let attempts = 0;
  while (prediction.neighbors.length < 4 && attempts < 2) {
    attempts += 1;
    const chosen = [prediction.primary_resident, ...prediction.neighbors];
    const fillBody = await callJev(
      buildJevFillRequest(thought, residents, chosen),
      endpoint,
      apiKey
    );
    if (!fillBody) break;
    const extra = collectSurrounderNames(
      fillBody,
      residents,
      new Set(chosen.map(slugifyResident)),
      new Set(chosen)
    );
    if (extra.length === 0) break;
    prediction.neighbors = [...prediction.neighbors, ...extra].slice(0, 4);
  }

  return prediction;
}
