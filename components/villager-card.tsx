"use client";

import { useEffect } from "react";
import { Compass, X } from "lucide-react";
import { ActionChip } from "@/components/action-chip";
import { DistrictBadge } from "@/components/district-badge";
import { PowerBar } from "@/components/power-bar";
import { VillagerPortrait } from "@/components/villager-portrait";
import { Button } from "@/components/ui/button";
import { districtColor } from "@/lib/residents";
import type { ThoughtItem, VillageNode } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

type Relation = { resident: VillageNode; strength: number; cross: boolean };

export function VillagerCard({
  resident,
  relations,
  thoughts,
  onClose,
  onTravel,
}: {
  resident: VillageNode;
  relations: Relation[];
  thoughts: ThoughtItem[];
  onClose: () => void;
  onTravel: () => void;
}) {
  // Escape closes the card.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="backdrop-dim fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="game-panel-gold flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${districtColor(
              resident.district
            )}, transparent)`,
          }}
        />
        <div className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-black/40 p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <VillagerPortrait
              name={resident.name}
              district={resident.district}
              size={64}
              className="sm:hidden"
            />
            <VillagerPortrait
              name={resident.name}
              district={resident.district}
              size={84}
              className="hidden sm:inline-flex"
            />
            <div className="min-w-0">
              <h2 className="font-display text-2xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)] sm:text-3xl">
                {resident.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DistrictBadge district={resident.district} />
                <span className="hud-chip">
                  ⚡ {Math.round(resident.power * 100)}% power
                </span>
                <span className="hud-chip">
                  {resident.mentions} reading
                  {resident.mentions === 1 ? "" : "s"} this week
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            size="icon"
            onClick={onClose}
            aria-label="Close card"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <PowerBar
            district={resident.district}
            power={resident.power}
            label="⚡ POWER IN YOUR VILLAGE"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-emerald-700/40 bg-emerald-500/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                ✨ Gift - when balanced
              </p>
              <p className="mt-1 text-sm font-bold text-slate-200">
                {resident.function}
              </p>
            </div>
            <div className="rounded-xl border-2 border-rose-900/40 bg-rose-500/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                🌑 Shadow - when it takes over
              </p>
              <p className="mt-1 text-sm font-bold text-slate-200">
                {resident.shadow || "None listed - lead it consciously."}
              </p>
            </div>
          </div>

          <p className="text-sm font-semibold leading-relaxed text-slate-400">
            {resident.description}
          </p>

          {/* Relations */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              🔗 Bonds in your village - {relations.length}
            </p>
            {relations.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">
                No agreed bonds yet. Agree with surrounding residents in the
                Council Hall chat.
              </p>
            ) : (
              <div className="space-y-1.5">
                {relations.map((relation) => (
                  <div
                    key={relation.resident.id}
                    className="flex items-center gap-2 rounded-lg border-2 border-black/30 bg-black/15 px-2.5 py-1.5"
                  >
                    <VillagerPortrait
                      name={relation.resident.name}
                      district={relation.resident.district}
                      size={30}
                      frame={false}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-200">
                      {relation.resident.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">
                      {relation.cross
                        ? relation.resident.district
                        : "same district"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-black/40">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.round(relation.strength * 100)}%`,
                            backgroundColor: districtColor(
                              relation.resident.district
                            ),
                          }}
                        />
                      </span>
                      <span className="w-8 text-right text-[10px] font-bold text-slate-400">
                        {Math.round(relation.strength * 100)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent readings */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              📜 Recent readings from {resident.name}
            </p>
            {thoughts.length === 0 ? (
              <p className="text-xs font-bold text-slate-500">
                Nothing logged yet. This resident has been silent.
              </p>
            ) : (
              <div className="space-y-2">
                {thoughts.map((thought) => (
                  <div
                    key={thought.id}
                    className="rounded-xl border-2 border-black/30 bg-black/15 p-3"
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-slate-300">
                      {thought.text}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <ActionChip action={thought.suggestedAction} />
                      <span className="text-[10px] font-bold text-slate-500">
                        {timeAgo(thought.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t-2 border-black/40 p-3">
          <span className="text-[10px] font-bold text-slate-500">
            Esc closes this card
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onTravel();
                onClose();
              }}
            >
              <Compass className="h-3.5 w-3.5" /> Center on map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
