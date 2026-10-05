import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 border-black/40 px-2.5 py-0.5 text-xs font-bold shadow-chip",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-gold-300/25 to-gold-500/10 text-gold-200",
        secondary:
          "bg-gradient-to-b from-[#243356] to-[#16203a] text-slate-200",
        outline: "bg-transparent text-muted-foreground",
        soft: "bg-white/5 text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
