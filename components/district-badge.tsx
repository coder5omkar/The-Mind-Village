import { districtMeta } from "@/lib/residents";
import { cn } from "@/lib/utils";

export function DistrictBadge({
  district,
  className,
}: {
  district: string;
  className?: string;
}) {
  const meta = districtMeta(district);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold shadow-chip",
        className
      )}
      style={{
        color: meta.color,
        borderColor: `${meta.color}66`,
        backgroundImage: `linear-gradient(180deg, ${meta.color}26, ${meta.color}0d)`,
      }}
    >
      <span className="text-[11px] leading-none">{meta.emoji}</span>
      {district}
    </span>
  );
}
