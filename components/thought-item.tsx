import { ActionChip } from "@/components/action-chip";
import { Card } from "@/components/ui/card";
import { VillagerPortrait } from "@/components/villager-portrait";
import { districtColor, districtMeta } from "@/lib/residents";
import type { ThoughtItem } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export function ThoughtItemCard({ thought }: { thought: ThoughtItem }) {
  const resident = thought.primaryResident;
  const color = resident ? districtColor(resident.district) : "#475569";
  const emoji = resident ? districtMeta(resident.district).emoji : "❔";

  return (
    <Card className="p-4 transition hover:border-gold-600/50">
      <div className="flex gap-3">
        {resident ? (
          <VillagerPortrait
            name={resident.name}
            district={resident.district}
            size={44}
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black/50 bg-[#0d1526] font-display text-sm text-slate-400">
            ?
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-relaxed text-slate-200">
            {thought.text}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            {resident ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-black/40 px-2.5 py-0.5 font-bold shadow-chip"
                style={{
                  color,
                  backgroundImage: `linear-gradient(180deg, ${color}26, ${color}0d)`,
                }}
              >
                {emoji} {resident.name}
              </span>
            ) : (
              <span className="italic text-slate-500">Unnamed</span>
            )}
            <ActionChip action={thought.suggestedAction} />
            <span className="ml-auto font-bold text-slate-500">
              {timeAgo(thought.createdAt)}
            </span>
          </div>
          {thought.feedback ? (
            <p className="mt-2 text-xs font-bold text-slate-500">
              {thought.feedback === "correct"
                ? "✅ You confirmed this reading."
                : thought.feedback === "partial"
                ? `🤔 Partly right - closer to ${
                    thought.correctedResident?.name ?? "another resident"
                  }.`
                : `❌ You corrected this to ${
                    thought.correctedResident?.name ?? "another resident"
                  }.`}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
