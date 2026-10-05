// DeepSeek V4.1 Flash integration (OpenAI-compatible chat API).
//
// Used as the second tier of the prediction chain: Jev -> DeepSeek -> local.
// Returns null on any failure so the engine can fall back gracefully.

import OpenAI from "openai";
import type { Prediction } from "./predictor";
import type { ResidentLite, SuggestedAction } from "./residents";
import { clamp } from "./utils";

const SYSTEM_PROMPT = `You are "The Village" - a psychological analysis tool.
Given a user's thought, identify which resident (identity/part) is speaking.

Return ONLY valid JSON in this exact shape:
{
  "primary_resident": "exact resident name from the list",
  "confidence": 0.0-1.0,
  "secondary_residents": [
    {"name": "resident name", "confidence": 0.0-1.0}
  ],
  "neighbors": ["resident name", "resident name"],
  "suggested_action": "increase" | "decrease" | "redirect" | "sleep",
  "reasoning": "one or two sentences explaining why"
}

Rules:
- primary_resident MUST be an exact name from the provided resident list.
- confidence reflects how clearly the thought matches that resident.
- secondary_residents: max 3, each with confidence.
- neighbors: 3-5 residents who commonly co-activate with the primary.
- suggested_action guides the user on what to do with this resident.
- reasoning: plain language, no jargon, compassionate tone.`;

const ACTIONS: SuggestedAction[] = ["increase", "decrease", "redirect", "sleep"];

function isAction(value: unknown): value is SuggestedAction {
  return typeof value === "string" && ACTIONS.includes(value as SuggestedAction);
}

/**
 * Validate and canonicalize whatever the model returned. Any name that is not
 * an exact resident is dropped, so the UI can never show a hallucinated part.
 */
function sanitizePrediction(
  raw: unknown,
  residents: ResidentLite[]
): Prediction | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const byLower = new Map(residents.map((r) => [r.name.toLowerCase(), r]));

  const primary = byLower.get(
    String(data.primary_resident ?? "").trim().toLowerCase()
  );
  if (!primary) return null;

  const confidence = clamp(Number(data.confidence) || 0.5, 0.05, 0.99);

  const secondary = Array.isArray(data.secondary_residents)
    ? data.secondary_residents
        .map((entry) => {
          const item = entry as Record<string, unknown>;
          const resident = byLower.get(
            String(item?.name ?? "").trim().toLowerCase()
          );
          if (!resident || resident.id === primary.id) return null;
          return {
            name: resident.name,
            confidence: clamp(Number(item?.confidence) || 0.3, 0.05, 0.95),
          };
        })
        .filter((entry): entry is { name: string; confidence: number } =>
          Boolean(entry)
        )
        .slice(0, 3)
    : [];

  const neighbors = Array.isArray(data.neighbors)
    ? data.neighbors
        .map((name) => byLower.get(String(name).trim().toLowerCase())?.name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 5)
    : [];

  const action = isAction(data.suggested_action)
    ? data.suggested_action
    : "redirect";

  const reasoning =
    typeof data.reasoning === "string" && data.reasoning.trim().length > 0
      ? data.reasoning.trim()
      : `This thought carries the voice of ${primary.name}.`;

  return {
    primary_resident: primary.name,
    confidence: Math.round(confidence * 100) / 100,
    secondary_residents: secondary,
    neighbors,
    suggested_action: action,
    reasoning,
  };
}

/** Returns null when DeepSeek is unavailable so the engine can fall back. */
export async function analyzeWithDeepSeek(
  thought: string,
  residents: ResidentLite[]
): Promise<Prediction | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const client = new OpenAI({
      apiKey,
      baseURL:
        process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com/v1",
    });

    const residentList = residents
      .map(
        (r) =>
          `- ${r.name} (${r.district}): ${r.function} | Shadow: ${
            r.shadow || "none listed"
          }`
      )
      .join("\n");

    const response = await client.chat.completions.create(
      {
        model: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4.1-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Residents:\n${residentList}\n\nThought: "${thought}"`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      },
      { timeout: 25000, maxRetries: 0 }
    );

    const content = response.choices[0]?.message?.content ?? "{}";
    const prediction = sanitizePrediction(JSON.parse(content), residents);
    if (!prediction) {
      console.warn("[village] DeepSeek returned an unmappable response.");
    }
    return prediction;
  } catch (error) {
    console.warn("[village] DeepSeek request failed:", error);
    return null;
  }
}
