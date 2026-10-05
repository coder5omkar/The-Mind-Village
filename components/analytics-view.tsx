"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { districtColor, districtMeta } from "@/lib/residents";
import type { AnalyticsResponse } from "@/lib/types";

type TooltipEntry = {
  name?: string;
  value?: number | null;
  color?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  percent,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  percent?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border-2 border-black/50 bg-[#16213f]/95 p-3 text-xs font-bold shadow-panel">
      <p className="mb-1.5 text-slate-400">{label}</p>
      {payload
        .filter((entry) => entry.value != null)
        .map((entry) => (
          <p key={entry.name} className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-200">{entry.name}</span>
            <span className="ml-auto pl-3 text-slate-400">
              {percent
                ? `${Math.round((entry.value ?? 0) * 100)}%`
                : entry.value}
            </span>
          </p>
        ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full p-5">
        <div className="flex items-center gap-2 text-slate-400">
          <Icon className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="mt-3 font-display text-3xl tracking-wide text-gold-300 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs font-bold text-slate-500">{hint}</p>
        ) : null}
        {children}
      </Card>
    </motion.div>
  );
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load analytics.");
        return response.json();
      })
      .then((payload: AnalyticsResponse) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled)
          setError("The records could not be loaded. Refresh to try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="game-panel p-8 text-center text-sm font-bold text-slate-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  const { stats, accuracy, topThisWeek, trends, districtBreakdown } = data;

  const trendData = trends.days.map((day, index) => {
    const row: Record<string, string | number | null> = { day: day.slice(5) };
    for (const serie of trends.series) {
      row[serie.name] = serie.values[index];
    }
    return row;
  });

  const topData = topThisWeek.map((entry) => ({
    name: entry.name.replace(/^The\s+/, ""),
    fullName: entry.name,
    count: entry.count,
    district: entry.district,
  }));

  const maxDistrict = Math.max(1, ...districtBreakdown.map((d) => d.count));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
          🏛️
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-wide text-gold-300 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
            THE HALL OF RECORDS
          </h1>
          <p className="text-sm font-semibold text-slate-400">
            Who has been leading, how accurate the readings are, how power is
            shifting.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="Awareness level"
          value={`Lv ${stats.level}`}
          hint={`${stats.title} - ${stats.xp}/${stats.xpNeeded} to next`}
          delay={0}
        >
          <div className="mt-3">
            <Progress value={stats.xp / stats.xpNeeded} color="#8be36f" />
          </div>
        </StatCard>
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`}
          hint="Consecutive days with a logged thought"
          delay={0.05}
        />
        <StatCard
          icon={Target}
          label="Reading accuracy"
          value={accuracy.total ? `${accuracy.percent}%` : "-"}
          hint={
            accuracy.total
              ? `${accuracy.correct} correct - ${accuracy.partial} partial - ${accuracy.wrong} corrected`
              : "Give feedback on readings to build this"
          }
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Thoughts logged"
          value={String(stats.total)}
          hint="Every thought sharpens the map"
          delay={0.15}
        />
      </div>

      {stats.total === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-5xl drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
            📊
          </p>
          <p className="mt-3 font-display text-xl tracking-wide text-gold-200">
            THE CHARTS ARE WAITING
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-400">
            Log a few thoughts in the Council Hall and this hall will show which
            residents dominate, how power shifts, and how often the village
            reads you correctly.
          </p>
        </Card>
      ) : (
        <>
          <Card className="p-5">
            <h2 className="font-display text-lg tracking-wide text-gold-200">
              ⚡ POWER OVER THE LAST 14 DAYS
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              The five residents you have met most often. Power rises with
              airtime and confirmed readings.
            </p>
            {trends.series.length === 0 ? (
              <p className="mt-6 text-sm font-semibold italic text-slate-500">
                Not enough history yet - keep logging.
              </p>
            ) : (
              <div className="mt-5 h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.1)"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="rgba(148,163,184,0.45)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[0, 1]}
                      stroke="rgba(148,163,184,0.45)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) =>
                        `${Math.round(value * 100)}%`
                      }
                    />
                    <Tooltip
                      content={<ChartTooltip percent />}
                      cursor={{ stroke: "rgba(148,163,184,0.25)" }}
                    />
                    {trends.series.map((serie) => (
                      <Line
                        key={serie.id}
                        type="monotone"
                        dataKey={serie.name}
                        stroke={districtColor(serie.district)}
                        strokeWidth={3}
                        dot={false}
                        connectNulls
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {trends.series.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-3">
                {trends.series.map((serie) => (
                  <span
                    key={serie.id}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: districtColor(serie.district) }}
                    />
                    {serie.name}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-display text-lg tracking-wide text-gold-200">
                🏆 TOP RESIDENTS THIS WEEK
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Who has been holding the microphone for the last 7 days.
              </p>
              {topData.length === 0 ? (
                <p className="mt-6 text-sm font-semibold italic text-slate-500">
                  No thoughts logged this week yet.
                </p>
              ) : (
                <div className="mt-5 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topData}
                      layout="vertical"
                      margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(148,163,184,0.1)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        stroke="rgba(148,163,184,0.45)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={104}
                        stroke="rgba(148,163,184,0.65)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      />
                      <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={22}>
                        {topData.map((entry) => (
                          <Cell
                            key={entry.fullName}
                            fill={districtColor(entry.district)}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="font-display text-lg tracking-wide text-gold-200">
                🗺️ DISTRICT ACTIVITY
              </h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Which territories of your mind get the most traffic.
              </p>
              <div className="mt-5 space-y-3">
                {districtBreakdown.map((entry) => {
                  const meta = districtMeta(entry.district);
                  return (
                    <div key={entry.district}>
                      <div className="mb-1 flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className="text-sm">{meta.emoji}</span>
                          {entry.district}
                        </span>
                        <span className="text-slate-500">{entry.count}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-black/40 bg-[#0b1120]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(entry.count / maxDistrict) * 100}%`,
                            backgroundImage: `linear-gradient(180deg, ${meta.color}, ${meta.color}bb)`,
                            opacity: entry.count ? 0.9 : 0,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
