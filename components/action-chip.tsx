import { ACTION_META, type SuggestedAction } from "@/lib/residents";
import { cn } from "@/lib/utils";

export function ActionChip({
  action,
  className,
  showHint = false,
  size = "default",
}: {
  action: string | null | undefined;
  className?: string;
  showHint?: boolean;
  size?: "default" | "lg";
}) {
  if (!action || !(action in ACTION_META)) return null;
  const meta = ACTION_META[action as SuggestedAction];
  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border-2 border-black/40 font-display uppercase tracking-wide shadow-chip",
          size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1 text-xs"
        )}
        style={{
          color: meta.color,
          borderColor: `${meta.color}55`,
          backgroundImage: `linear-gradient(180deg, ${meta.color}33, ${meta.color}14)`,
          textShadow: "0 1px 0 rgba(0,0,0,0.45)",
        }}
      >
        <span className="text-sm leading-none">{meta.emoji}</span>
        {meta.label}
      </span>
      {showHint ? (
        <span className="text-xs text-muted-foreground">{meta.hint}</span>
      ) : null}
    </span>
  );
}
