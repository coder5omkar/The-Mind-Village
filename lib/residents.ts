// Shared vocabulary for The Village: districts, colors, actions and API types.

export type District =
  | "Cognitive"
  | "Professional"
  | "Money"
  | "Relational"
  | "Emotional"
  | "Creative"
  | "Body"
  | "Spiritual"
  | "Primal"
  | "Destructive"
  | "Higher";

export const DISTRICT_ORDER: District[] = [
  "Cognitive",
  "Professional",
  "Money",
  "Relational",
  "Emotional",
  "Creative",
  "Body",
  "Spiritual",
  "Primal",
  "Destructive",
  "Higher",
];

export type DistrictMeta = {
  color: string;
  emoji: string;
  description: string;
  tagline: string;
};

export const DISTRICT_META: Record<District, DistrictMeta> = {
  Cognitive: {
    color: "#6366f1",
    emoji: "🧠",
    description: "Thinking, planning, understanding, questioning.",
    tagline: "The mind trying to think its way to safety.",
  },
  Professional: {
    color: "#94a3b8",
    emoji: "💼",
    description: "Work, craft, ambition, standing among others.",
    tagline: "The part of you measured by output and standing.",
  },
  Money: {
    color: "#f59e0b",
    emoji: "🪙",
    description: "Worth, safety, giving and receiving resources.",
    tagline: "Worth and safety are being counted here.",
  },
  Relational: {
    color: "#fb7185",
    emoji: "❤️",
    description: "Love, family, friendship, belonging.",
    tagline: "This voice is about closeness and what others mean to you.",
  },
  Emotional: {
    color: "#a78bfa",
    emoji: "🎭",
    description: "Feeling, mood, and the weather inside.",
    tagline: "A feeling is asking to be heard before it is solved.",
  },
  Creative: {
    color: "#2dd4bf",
    emoji: "🎨",
    description: "Making, playing, expressing, imagining.",
    tagline: "Something in you wants to make, play, or express.",
  },
  Body: {
    color: "#34d399",
    emoji: "💪",
    description: "Energy, rest, hunger, sensation, movement.",
    tagline: "The body is speaking - energy, rest, hunger, or sensation.",
  },
  Spiritual: {
    color: "#38bdf8",
    emoji: "🕊️",
    description: "Meaning, surrender, gratitude, observation.",
    tagline: "This voice reaches for meaning beyond the immediate.",
  },
  Primal: {
    color: "#fb923c",
    emoji: "🐺",
    description: "Survival, protection, instinct, play.",
    tagline: "An old survival system has switched on.",
  },
  Destructive: {
    color: "#991b1b",
    emoji: "💀",
    description: "Old guardians that protect in costly ways.",
    tagline: "This resident protects you in a costly way - it wounds to feel safe.",
  },
  Higher: {
    color: "#fde047",
    emoji: "✨",
    description: "Clarity, courage, compassion, freedom.",
    tagline: "Your clearest self is available here.",
  },
};

export type SuggestedAction = "increase" | "decrease" | "redirect" | "sleep";

export const ACTION_META: Record<
  SuggestedAction,
  { label: string; hint: string; color: string; emoji: string }
> = {
  increase: {
    label: "Increase",
    hint: "Let this resident lead a little more.",
    color: "#34d399",
    emoji: "⬆️",
  },
  decrease: {
    label: "Decrease",
    hint: "Hear it, thank it, and turn its volume down.",
    color: "#fb7185",
    emoji: "⬇️",
  },
  redirect: {
    label: "Redirect",
    hint: "Let this energy serve a different purpose.",
    color: "#38bdf8",
    emoji: "🔄",
  },
  sleep: {
    label: "Put to sleep",
    hint: "This one is tired. Let it rest for now.",
    color: "#94a3b8",
    emoji: "😴",
  },
};

export type ResidentLite = {
  id: string;
  name: string;
  district: string;
  function: string;
  shadow: string;
  description: string;
};

export function districtColor(district: string): string {
  return (
    DISTRICT_META[district as District]?.color ?? DISTRICT_META.Cognitive.color
  );
}

export function districtMeta(district: string): DistrictMeta {
  return DISTRICT_META[district as District] ?? DISTRICT_META.Cognitive;
}
