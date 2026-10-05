import type { Prediction } from "./predictor";
import type { SuggestedAction } from "./residents";

// Client-facing API shapes (no Prisma types leak into the browser bundle).

export type ResidentSummary = {
  id: string;
  name: string;
  district: string;
  function: string;
  shadow: string;
  description: string;
};

export type ThoughtItem = {
  id: string;
  text: string;
  confidence: number | null;
  suggestedAction: string | null;
  reasoning: string | null;
  feedback: string | null;
  source: string | null;
  createdAt: string;
  primaryResident: ResidentSummary | null;
  correctedResident: ResidentSummary | null;
  secondaryResidents: { name: string; confidence: number }[];
  neighbors: { id?: string; name: string; district?: string }[];
};

export type AnalyzeResponse = {
  thought: ThoughtItem;
  prediction: Prediction;
  primary: ResidentSummary;
  secondary: {
    name: string;
    confidence: number;
    resident: ResidentSummary;
  }[];
  neighbors: ResidentSummary[];
  source: "jev" | "deepseek" | "local";
};

export type VillageNode = ResidentSummary & {
  power: number;
  mentions: number;
  active: boolean;
};

export type VillageEdge = {
  id: string;
  residentAId: string;
  residentBId: string;
  strength: number;
};

export type VillageStats = {
  total: number;
  level: number;
  xp: number;
  xpNeeded: number;
  title: string;
  streak: number;
  activeResidents: number;
};

export type VillageResponse = {
  nodes: VillageNode[];
  edges: VillageEdge[];
  thoughts: ThoughtItem[];
  stats: VillageStats;
};

export type AnalyticsResponse = {
  stats: {
    total: number;
    level: number;
    xp: number;
    xpNeeded: number;
    title: string;
    streak: number;
  };
  accuracy: {
    correct: number;
    partial: number;
    wrong: number;
    total: number;
    percent: number;
  };
  topThisWeek: {
    id: string;
    name: string;
    district: string;
    count: number;
  }[];
  trends: {
    days: string[];
    series: {
      id: string;
      name: string;
      district: string;
      values: (number | null)[];
    }[];
  };
  districtBreakdown: { district: string; count: number }[];
};

export type ResidentsResponse = {
  count: number;
  districts: {
    name: string;
    color: string;
    description: string;
    residents: ResidentSummary[];
  }[];
};

export type ActionName = SuggestedAction;
