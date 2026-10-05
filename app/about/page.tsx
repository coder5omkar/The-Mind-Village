import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { ActionChip } from "@/components/action-chip";
import { buttonVariants } from "@/components/ui/button";
import {
  ACTION_META,
  DISTRICT_META,
  DISTRICT_ORDER,
  type SuggestedAction,
} from "@/lib/residents";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Pause", text: "Notice the thought or feeling before reacting to it. Nothing has to be solved yet." },
  { title: "Name", text: "Ask which resident of the village is speaking right now. A thought is weather, not identity." },
  { title: "Locate", text: "See its district and which neighboring residents are co-active. Voices rarely travel alone." },
  { title: "Weigh", text: "Read the confidence and how much power this resident currently holds." },
  { title: "Choose", text: "Increase, decrease, redirect, or put the resident to sleep. You are the mayor, not the resident." },
  { title: "Return", text: "Log what happened. Every correction levels up the village and your map grows truer." },
];

const ACTIONS = Object.keys(ACTION_META) as SuggestedAction[];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-10 flex items-center justify-between">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="h-4 w-4" /> Camp
        </Link>
        <Link href="/app" className={cn(buttonVariants({ variant: "success", size: "sm" }))}>
          <Play className="h-3.5 w-3.5" /> Play now
        </Link>
      </header>

      <section>
        <p className="hud-chip border-gold-600/60 text-gold-200">📖 The lore</p>
        <h1 className="mt-5 font-display text-4xl leading-tight tracking-wide text-gold-300 [text-shadow:0_3px_0_rgba(0,0,0,0.5)] md:text-5xl">
          YOU ARE NOT ONE PERSON.
          <br />
          YOU ARE A VILLAGE.
        </h1>
        <div className="mt-7 space-y-5 text-base font-semibold leading-relaxed text-slate-400">
          <p>
            Most suffering is not caused by reality itself. It is caused by the
            gap between what an internal voice expects and what the external
            world delivers. That voice feels like <em>you</em> - but it is only
            one resident of the village, speaking very loudly.
          </p>
          <p>
            The Village treats your mind as a settlement of parts: a Thinker, a
            Critic, a Lover, a Survivor, a Child. Each resident has a{" "}
            <strong className="text-slate-200">function</strong> - the job it
            does well - and a{" "}
            <strong className="text-slate-200">shadow</strong> - what happens
            when it runs the whole village.
          </p>
          <p>
            Peace does not come from silencing anyone. It comes from knowing who
            is speaking, seeing who is co-active, and consciously choosing who
            leads. The residents become neighbors instead of rulers.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          THE QUEST GUIDE
        </h2>
        <div className="mt-7 space-y-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="game-panel flex gap-5 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 font-display text-lg text-[#3d2500] shadow-[0_3px_0_#7a5310]">
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-lg tracking-wide text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-400">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          THE FOUR ACTIONS
        </h2>
        <p className="mt-3 text-sm font-semibold text-slate-400">
          Every reading ends with a gentle suggestion - never a command.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ACTIONS.map((action) => (
            <div key={action} className="game-panel p-5">
              <ActionChip action={action} size="lg" />
              <p className="mt-3 text-sm font-semibold text-slate-400">
                {ACTION_META[action].hint}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          THE ELEVEN DISTRICTS
        </h2>
        <p className="mt-3 text-sm font-semibold text-slate-400">
          Eleven territories, each protecting something different.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DISTRICT_ORDER.map((district) => {
            const meta = DISTRICT_META[district];
            return (
              <div
                key={district}
                className="rounded-2xl border-2 border-b-4 p-5 shadow-[0_4px_0_rgba(0,0,0,0.35)]"
                style={{
                  borderColor: `${meta.color}55`,
                  backgroundImage: `linear-gradient(180deg, ${meta.color}26, ${meta.color}0a)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
                    {meta.emoji}
                  </span>
                  <span className="font-display text-base tracking-wide text-slate-100">
                    {district}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-400">
                  {meta.description}
                </p>
                <p className="mt-2 text-xs italic text-slate-500">
                  {meta.tagline}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-14 border-t-2 border-black/30 pt-8 text-center">
        <Link
          href="/app"
          className={cn(buttonVariants({ variant: "success", size: "xl" }))}
        >
          <Play className="h-5 w-5" /> Begin with one thought
        </Link>
        <p className="mt-6 text-xs font-bold text-slate-500">
          The Village is a self-reflection tool, not medical advice. If you are
          in crisis, please reach out to a professional or someone you trust.
        </p>
      </footer>
    </div>
  );
}
