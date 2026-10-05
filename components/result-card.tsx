"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, HelpCircle, X } from "lucide-react";
import { ActionChip } from "@/components/action-chip";
import { DistrictBadge } from "@/components/district-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { VillagerPortrait } from "@/components/villager-portrait";
import { districtColor } from "@/lib/residents";
import type {
  AnalyzeResponse,
  ResidentSummary,
  ThoughtItem,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type FeedbackValue = "correct" | "partial" | "wrong";

export function ResultCard({
  result,
  residents,
  onFeedback,
}: {
  result: AnalyzeResponse;
  residents: ResidentSummary[];
  onFeedback: (thought: ThoughtItem) => void;
}) {
  const { primary, secondary, neighbors, thought, source } = result;
  const color = districtColor(primary.district);

  const [mode, setMode] = useState<null | "partial" | "wrong">(null);
  const [correctedId, setCorrectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(thought.feedback);
  const [error, setError] = useState<string | null>(null);

  async function sendFeedback(
    feedback: FeedbackValue,
    correctedResidentId?: string
  ) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/thoughts/${thought.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback, correctedResidentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save your feedback.");
      }
      setSaved(feedback);
      setMode(null);
      onFeedback(data.thought as ThoughtItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4 overflow-hidden animate-pop-in">
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <VillagerPortrait
              name={primary.name}
              district={primary.district}
              size={64}
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
                A resident has spoken
              </p>
              <h3 className="font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
                {primary.name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DistrictBadge district={primary.district} />
                <span className="text-[10px] font-bold text-slate-500">
                  {source === "jev"
                    ? "⚖️ Read by Jev (TypeSafe)"
                    : source === "deepseek"
                    ? "🔮 Read by DeepSeek V4.1 Flash"
                    : "🧭 Read by the village intuition"}
                </span>
              </div>
            </div>
          </div>
          <div className="min-w-[190px]">
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-400">
              <span>READING STRENGTH</span>
              <span className="text-gold-200">
                {Math.round((thought.confidence ?? 0) * 100)}%
              </span>
            </div>
            <Progress value={thought.confidence ?? 0} color={color} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-black/40 bg-[#0d1526]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              ⚒️ Function
            </p>
            <p className="mt-1.5 text-sm font-bold text-slate-200">
              {primary.function}
            </p>
          </div>
          <div className="rounded-xl border-2 border-black/40 bg-[#0d1526]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              🌑 Shadow
            </p>
            <p className="mt-1.5 text-sm font-bold text-slate-200">
              {primary.shadow || "None listed - lead it consciously."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              ⚑ Suggested action
            </p>
            <ActionChip action={thought.suggestedAction} size="lg" showHint />
          </div>
          <div className="flex-1 rounded-xl border-2 border-black/40 bg-[#0d1526]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              🗣️ The council says
            </p>
            <p className="mt-1.5 font-serif text-sm italic leading-relaxed text-slate-300">
              {thought.reasoning}
            </p>
          </div>
        </div>

        {secondary.length > 0 ? (
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Also active
            </p>
            <div className="flex flex-wrap gap-2">
              {secondary.map((entry) => (
                <span
                  key={entry.name}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black/40 bg-gradient-to-b from-[#243356] to-[#16203a] px-3 py-1 text-xs font-bold shadow-chip"
                >
                  <VillagerPortrait
                    name={entry.name}
                    district={entry.resident.district}
                    size={22}
                    frame={false}
                  />
                  {entry.name}
                  <span className="text-slate-500">
                    {Math.round(entry.confidence * 100)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {neighbors.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Neighbors who stand beside {primary.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {neighbors.map((neighbor) => (
                <span
                  key={neighbor.id}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black/40 bg-[#0d1526]/70 px-3 py-1 text-xs font-bold text-slate-300"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: districtColor(neighbor.district),
                      boxShadow: `0 0 6px ${districtColor(neighbor.district)}`,
                    }}
                  />
                  {neighbor.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-7 border-t-2 border-black/30 pt-5">
          {saved ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#2c6e1e] bg-gradient-to-b from-[#8be36f]/20 to-[#4aa832]/10 px-4 py-2 text-sm font-bold text-emerald-300"
            >
              <Check className="h-4 w-4" />
              {saved === "correct"
                ? "The village remembers this voice. +10 XP"
                : saved === "partial"
                ? "Partly right - the power has shifted a little."
                : "Correction logged. The map just grew truer."}
            </motion.div>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Was this the right resident?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="success"
                  size="sm"
                  disabled={saving}
                  onClick={() => sendFeedback("correct")}
                >
                  <Check className="h-3.5 w-3.5" /> Correct!
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={saving}
                  onClick={() => setMode(mode === "partial" ? null : "partial")}
                >
                  <HelpCircle className="h-3.5 w-3.5" /> Partly
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={saving}
                  onClick={() => setMode(mode === "wrong" ? null : "wrong")}
                >
                  <X className="h-3.5 w-3.5" /> Wrong
                </Button>
              </div>

              {mode ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                >
                  <Select
                    value={correctedId}
                    onChange={(event) => setCorrectedId(event.target.value)}
                  >
                    <option value="">Which resident was actually speaking?</option>
                    {residents.map((resident) => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - {resident.district}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={!correctedId || saving}
                    onClick={() =>
                      sendFeedback(
                        mode === "partial" ? "partial" : "wrong",
                        correctedId
                      )
                    }
                    className={cn("shrink-0")}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </motion.div>
              ) : null}
            </>
          )}
          {error ? (
            <p className="mt-3 text-sm font-bold text-rose-300/90">{error}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
