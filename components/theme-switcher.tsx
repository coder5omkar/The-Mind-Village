"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "night", label: "Night", emoji: "🌙" },
  { id: "dawn", label: "Dawn", emoji: "🌅" },
  { id: "ocean", label: "Ocean", emoji: "🌊" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];
const STORAGE_KEY = "village-theme";

export function ThemeSwitcher({ className }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeId>("night");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((item) => item.id === saved)) {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function apply(next: ThemeId) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-xl border-2 border-black/40 bg-[#0d1526]/80 p-0.5",
        className
      )}
      title="Change the village theme"
    >
      {THEMES.map((item) => (
        <button
          key={item.id}
          onClick={() => apply(item.id)}
          title={`${item.label} theme`}
          aria-label={`${item.label} theme`}
          className={cn(
            "rounded-lg px-1.5 py-1 text-sm leading-none transition",
            theme === item.id
              ? "bg-gradient-to-b from-gold-300 to-gold-500 shadow-[0_2px_0_#7a5310]"
              : "opacity-60 hover:bg-white/5 hover:opacity-100"
          )}
        >
          {item.emoji}
        </button>
      ))}
    </div>
  );
}
