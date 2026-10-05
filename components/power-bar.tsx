import { districtColor } from "@/lib/residents";
import { Progress } from "@/components/ui/progress";

export function PowerBar({
  district,
  power,
  label,
  className,
}: {
  district: string;
  power: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>{label}</span>
          <span>{Math.round(power * 100)}%</span>
        </div>
      ) : null}
      <Progress value={power} color={districtColor(district)} />
    </div>
  );
}
