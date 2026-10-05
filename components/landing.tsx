"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, Eye, HandHeart, Play } from "lucide-react";
import { GoogleSignInButton } from "@/components/google-sign-in";
import { buttonVariants } from "@/components/ui/button";
import { DISTRICT_META, DISTRICT_ORDER } from "@/lib/residents";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Pause", text: "Notice the thought or feeling before reacting to it." },
  { title: "Name", text: "Ask which resident of the village is speaking right now." },
  { title: "Locate", text: "See its district and which neighbors are co-active." },
  { title: "Weigh", text: "Read the confidence and how much power this resident holds." },
  { title: "Choose", text: "Increase, decrease, redirect, or put the resident to sleep." },
  { title: "Return", text: "Log what happened. The village levels up with you." },
];

const PILLARS = [
  {
    icon: Eye,
    title: "Name the voice",
    text: "Write what is on your mind. The village finds which resident - thinker, critic, lover, survivor - is generating it.",
    emoji: "🔮",
  },
  {
    icon: Compass,
    title: "Scout the neighbors",
    text: "Residents rarely act alone. The map reveals who is co-active so you see the whole pattern.",
    emoji: "🗺️",
  },
  {
    icon: HandHeart,
    title: "Choose who leads",
    text: "Get a kind suggestion and watch resident power rise and fall as your village grows.",
    emoji: "👑",
  },
];

const FLOATERS = [
  { emoji: "🏰", top: "14%", left: "7%", delay: 0 },
  { emoji: "🧠", top: "24%", left: "84%", delay: 1.2 },
  { emoji: "🌲", top: "58%", left: "4%", delay: 0.6 },
  { emoji: "✨", top: "70%", left: "88%", delay: 1.8 },
  { emoji: "⚔️", top: "10%", left: "46%", delay: 2.4 },
  { emoji: "🪙", top: "84%", left: "42%", delay: 0.9 },
];

export function Landing({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative overflow-hidden">
      {/* ambient floaters */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {FLOATERS.map((floater) => (
          <motion.span
            key={floater.emoji + floater.top}
            className="absolute text-3xl opacity-60 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]"
            style={{ top: floater.top, left: floater.left }}
            animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              delay: floater.delay,
              ease: "easeInOut",
            }}
          >
            {floater.emoji}
          </motion.span>
        ))}
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <span className="flex items-center gap-2 font-display text-xl text-gold-300 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          <span className="text-3xl">🏰</span> THE VILLAGE
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/about"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Lore
          </Link>
          {signedIn ? (
            <Link href="/app" className={cn(buttonVariants({ size: "sm" }))}>
              Continue
            </Link>
          ) : (
            <Link
              href="/app"
              className={cn(buttonVariants({ variant: "success", size: "sm" }))}
            >
              Play now
            </Link>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-16 pt-12 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hud-chip mb-6 border-gold-600/60 text-gold-200"
        >
          ⚔️ A psychological self-awareness quest
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-5xl leading-[1.05] tracking-wide text-gold-300 [text-shadow:0_4px_0_rgba(0,0,0,0.55),0_0_40px_rgba(244,197,66,0.25)] md:text-7xl"
        >
          YOU ARE NOT ONE PERSON.
          <br />
          <span className="bg-gradient-to-b from-sky-200 via-sky-300 to-teal-400 bg-clip-text text-transparent">
            YOU ARE A VILLAGE.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-base font-semibold leading-relaxed text-slate-300 md:text-lg"
        >
          Suffering lives in the gap between internal expectations and external
          reality. Meet your 79 residents, find who is speaking, and choose who
          leads.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {signedIn ? (
            <Link
              href="/app"
              className={cn(buttonVariants({ variant: "success", size: "xl" }))}
            >
              <Play className="h-5 w-5" /> Enter the village
            </Link>
          ) : (
            <Link
              href="/app"
              className={cn(buttonVariants({ variant: "success", size: "xl" }))}
            >
              <Play className="h-5 w-5" /> Play as Visitor
            </Link>
          )}
          <GoogleSignInButton
            label="Sign in with Google"
            className="h-14 px-6 text-base"
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-4 text-xs font-bold text-slate-400"
        >
          No account needed to play. Sign in later to save your progress.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="hud-chip">🧑‍🌾 79 residents</span>
          <span className="hud-chip">🗺️ 11 districts</span>
          <span className="hud-chip">🔗 486 bonds</span>
          <span className="hud-chip">⚡ Levels & streaks</span>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-center font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          HOW TO PLAY
        </h2>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="game-panel p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]">
                  {pillar.emoji}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-gold-700 bg-gradient-to-b from-gold-300 to-gold-500 font-display text-sm text-[#3d2500] shadow-[0_2px_0_#7a5310]">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-display text-lg tracking-wide text-gold-200">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
                {pillar.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-center font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          THE DISTRICTS
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm font-semibold text-slate-400">
          Eleven territories. Every resident has a gift and a shadow.
        </p>
        <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {DISTRICT_ORDER.map((district, index) => {
            const meta = DISTRICT_META[district];
            return (
              <motion.div
                key={district}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (index % 4) * 0.05 }}
                className="rounded-2xl border-2 border-b-4 p-4 shadow-[0_4px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5"
                style={{
                  borderColor: `${meta.color}55`,
                  backgroundImage: `linear-gradient(180deg, ${meta.color}26, ${meta.color}0a)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">
                    {meta.emoji}
                  </span>
                  <span className="font-display text-sm tracking-wide text-slate-100">
                    {district}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-400">
                  {meta.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 py-14">
        <h2 className="text-center font-display text-3xl tracking-wide text-gold-200 [text-shadow:0_2px_0_rgba(0,0,0,0.5)]">
          THE QUEST GUIDE
        </h2>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="game-panel flex gap-4 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-black/40 bg-gradient-to-b from-[#243356] to-[#16203a] font-display text-gold-300 shadow-chip">
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-base tracking-wide text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-20 pt-6 text-center">
        <Link
          href="/app"
          className={cn(buttonVariants({ variant: "success", size: "xl" }))}
        >
          <Play className="h-5 w-5" /> Start your village
        </Link>
      </section>

      <footer className="relative z-10 border-t-2 border-black/40 py-8 text-center text-xs font-bold text-slate-500">
        The Village - know who is speaking, then choose who leads.
      </footer>
    </div>
  );
}
