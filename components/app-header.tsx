"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import {
  Flame,
  LineChart,
  LogOut,
  Network,
  ScrollText,
  Star,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app/village", label: "Map", icon: Network },
  { href: "/app/analytics", label: "Records", icon: LineChart },
];

type Props = {
  user: { name: string | null; email: string | null; image: string | null };
  isGuest: boolean;
  level: { level: number; xp: number; xpNeeded: number; title: string };
  streak: number;
  total: number;
};

function Tab({
  href,
  label,
  icon: Icon,
  active,
  className,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border-2 border-b-4 px-3 py-1.5 font-display text-sm uppercase tracking-wide transition-all duration-100 active:translate-y-[2px] active:border-b-2",
        active
          ? "border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 text-[#3d2500] shadow-[0_3px_0_#7a5310] [text-shadow:0_1px_0_rgba(255,255,255,0.35)]"
          : "border-black/50 bg-gradient-to-b from-[#243356] to-[#18233d] text-slate-300 shadow-[0_3px_0_rgba(0,0,0,0.4)] hover:brightness-110",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function AppHeader({ user, isGuest, level, streak, total }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-black/60 bg-gradient-to-b from-[#16213f] to-[#0c1428] shadow-[0_6px_24px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-3">
        <Link href="/app/village" className="flex shrink-0 items-center gap-2">
          <span className="animate-wiggle text-3xl drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
            🏰
          </span>
          <span className="hidden font-display text-xl tracking-wide text-gold-300 [text-shadow:0_2px_0_rgba(0,0,0,0.5)] lg:block">
            THE VILLAGE
          </span>
        </Link>

        <nav className="ml-1 hidden items-center gap-1.5 sm:flex">
          {NAV.map((item) => (
            <Tab
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeSwitcher className="hidden md:flex" />
          <div
            className="hud-chip hidden md:inline-flex"
            title={`${level.title} - ${level.xp}/${level.xpNeeded} XP to next level`}
          >
            <Star className="h-3.5 w-3.5 text-gold-300" />
            <span className="text-gold-200">Lv {level.level}</span>
            <span className="hidden text-slate-400 lg:inline">
              {level.title}
            </span>
            <span className="w-14">
              <Progress
                value={level.xp / level.xpNeeded}
                className="h-2"
                color="#8be36f"
              />
            </span>
          </div>
          <div className="hud-chip" title="Daily logging streak">
            <Flame className="h-3.5 w-3.5 text-orange-300" />
            <span className="text-orange-200">{streak}</span>
          </div>
          <div className="hud-chip hidden sm:inline-flex" title="Thoughts logged">
            <ScrollText className="h-3.5 w-3.5 text-sky-300" />
            <span className="text-sky-200">{total}</span>
          </div>

          {isGuest ? (
            <>
              <span className="hud-chip hidden border-gold-600/60 xl:inline-flex">
                <span>👋</span> Visitor
              </span>
              <Button
                size="sm"
                title="Save your village to an account"
                onClick={() => signIn("google", { callbackUrl: "/app" })}
              >
                Save progress
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Avatar name={user.name} src={user.image} size={34} />
                <div className="hidden leading-tight lg:block">
                  <p className="max-w-[140px] truncate text-xs font-bold">
                    {user.name ?? "Villager"}
                  </p>
                  <p className="max-w-[140px] truncate text-[10px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Sign out"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1.5 border-t-2 border-black/40 px-3 py-2 sm:hidden">
        {NAV.map((item) => (
          <Tab
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            className="flex-1"
          />
        ))}
      </nav>
    </header>
  );
}
