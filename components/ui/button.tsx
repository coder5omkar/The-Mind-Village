import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Chunky 3D game buttons: a gradient face, a dark "depth" border at the
// bottom, and a satisfying press-down effect.
const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 font-display uppercase tracking-wide transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "border-gold-700 border-b-4 bg-gradient-to-b from-gold-300 to-gold-500 text-[#3d2500] shadow-[0_4px_0_#7a5310] [text-shadow:0_1px_0_rgba(255,255,255,0.35)] hover:brightness-105 active:border-b-2 active:shadow-[0_2px_0_#7a5310]",
        success:
          "border-[#2c6e1e] border-b-4 bg-gradient-to-b from-[#8be36f] to-[#4aa832] text-[#0f3d08] shadow-[0_4px_0_#2c6e1e] [text-shadow:0_1px_0_rgba(255,255,255,0.3)] hover:brightness-105 active:border-b-2 active:shadow-[0_2px_0_#2c6e1e]",
        soft: "border-[#24518f] border-b-4 bg-gradient-to-b from-[#6db3ff] to-[#3b7fd4] text-[#06213f] shadow-[0_4px_0_#24518f] [text-shadow:0_1px_0_rgba(255,255,255,0.3)] hover:brightness-105 active:border-b-2 active:shadow-[0_2px_0_#24518f]",
        secondary:
          "border-[#232c3d] border-b-4 bg-gradient-to-b from-[#5b6b8c] to-[#3d4a63] text-white shadow-[0_4px_0_#232c3d] hover:brightness-110 active:border-b-2 active:shadow-[0_2px_0_#232c3d]",
        destructive:
          "border-[#96301f] border-b-4 bg-gradient-to-b from-[#ff9d8a] to-[#e0523f] text-[#4a1108] shadow-[0_4px_0_#96301f] hover:brightness-105 active:border-b-2 active:shadow-[0_2px_0_#96301f]",
        outline:
          "border-slate-600/70 border-b-4 bg-[#0d1526]/90 text-slate-200 shadow-[0_4px_0_rgba(0,0,0,0.4)] hover:border-gold-400/70 hover:text-gold-200 active:border-b-2 active:shadow-[0_2px_0_rgba(0,0,0,0.4)]",
        ghost:
          "border-transparent text-slate-300 hover:bg-white/5 hover:text-white",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base",
        xl: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-10 w-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
