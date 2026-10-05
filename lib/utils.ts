import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Safely read a JSON column that may be stored as Json (Postgres) or text. */
export function parseJsonArray<T = unknown>(value: unknown): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function timeAgo(date: Date | string) {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.max(1, Math.floor((Date.now() - then.getTime()) / 1000));
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];
  let value = seconds;
  let unit = "second";
  for (const [step, nextUnit] of units) {
    if (value < step) break;
    value = value / step;
    unit = nextUnit;
  }
  const rounded = Math.floor(value);
  return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
}

/** "The Image-Conscious Mind" -> "IM", "The Thinking Mind" -> "TM" (portrait circles). */
export function initials(name: string) {
  return name
    .replace(/^The\s+/i, "")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
