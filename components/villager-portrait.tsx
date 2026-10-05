/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { districtColor } from "@/lib/residents";
import { cn, initials } from "@/lib/utils";

// Every villager gets a real illustrated portrait. Avatars are deterministic
// (seeded by the resident name), so "The Critic" always looks like The Critic.
// If the image service is unreachable, we fall back to initials.

export function villagerAvatarUrl(name: string, district: string) {
  const color = districtColor(district).replace("#", "");
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(
    name
  )}&backgroundColor=${color},0f172a&backgroundType=gradientLinear&radius=50&scale=92`;
}

export function VillagerPortrait({
  name,
  district,
  size = 56,
  className,
  frame = true,
}: {
  name: string;
  district: string;
  size?: number;
  className?: string;
  frame?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const color = districtColor(district);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border-[3px] border-[#0f172a] bg-[#0d1526]",
        className
      )}
      style={{
        width: size,
        height: size,
        boxShadow: frame
          ? `0 0 0 2px ${color}55, 0 4px 0 rgba(0,0,0,0.35)`
          : "0 4px 0 rgba(0,0,0,0.35)",
      }}
    >
      {failed ? (
        <span
          className="font-display text-white"
          style={{
            fontSize: Math.max(10, size * 0.34),
            textShadow: "0 2px 0 rgba(0,0,0,0.4)",
          }}
        >
          {initials(name)}
        </span>
      ) : (
        <img
          src={villagerAvatarUrl(name, district)}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
