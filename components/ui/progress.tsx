import { cn, clamp } from "@/lib/utils";

export function Progress({
  value,
  color = "#f4c542",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-3 w-full overflow-hidden rounded-full border-2 border-black/50 bg-[#0b1120] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <div
        className="relative h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.round(clamp(value, 0, 1) * 100)}%`,
          backgroundImage: `linear-gradient(180deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 10px ${color}66`,
        }}
      >
        <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/25" />
      </div>
    </div>
  );
}
