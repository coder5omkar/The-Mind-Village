// The prediction engine chain: Jev -> DeepSeek -> local intuition.
//
// Jev (TypeSafe) is preferred because it returns typed, calibrated decisions
// instead of text. If its key is missing or the call fails, DeepSeek handles
// it. If that fails too, the built-in TypeScript engine answers so the village
// never goes silent.

import { analyzeWithDeepSeek } from "./deepseek";
import { analyzeWithJev } from "./jev";
import {
  predictLocally,
  safetyNote,
  type Prediction,
} from "./predictor";
import type { ResidentLite } from "./residents";

export type AnalysisSource = "jev" | "deepseek" | "local";

export type AnalysisResult = {
  prediction: Prediction;
  source: AnalysisSource;
};

function applySafety(prediction: Prediction, thought: string): Prediction {
  const note = safetyNote(thought);
  if (!note || prediction.reasoning.includes(note)) return prediction;
  return { ...prediction, reasoning: `${prediction.reasoning} ${note}` };
}

export async function analyzeThought(
  thought: string,
  residents: ResidentLite[]
): Promise<AnalysisResult> {
  if (process.env.JEV_API_KEY?.trim()) {
    const prediction = await analyzeWithJev(thought, residents);
    if (prediction) {
      return { prediction: applySafety(prediction, thought), source: "jev" };
    }
    console.warn("[village] Jev unavailable - trying DeepSeek.");
  }

  if (process.env.DEEPSEEK_API_KEY?.trim()) {
    const prediction = await analyzeWithDeepSeek(thought, residents);
    if (prediction) {
      return {
        prediction: applySafety(prediction, thought),
        source: "deepseek",
      };
    }
    console.warn("[village] DeepSeek unavailable - using local intuition.");
  }

  return {
    prediction: applySafety(predictLocally(thought, residents), thought),
    source: "local",
  };
}
