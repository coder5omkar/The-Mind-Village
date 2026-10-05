# The Village

> You are not one person. You are a village.

The Village is a psychological self-awareness tool. You write down a thought,
and the app identifies which **resident** (identity/part) of your mind is
speaking, shows the **neighboring residents** that may be co-active, and
suggests whether to **increase, decrease, redirect, or put that resident to
sleep**.

The core premise: suffering comes from the gap between internal expectations
and external reality. Peace comes from knowing who is speaking - and choosing
who leads.

---

## Features

- **Play as a visitor** - no account, no wall. Enter the village instantly and
  try everything. Sign in with Google later and your progress moves with you.
- **Game-like world** - a Clash-of-Clans-flavoured HUD with XP levels, daily
  streaks, power bars, a grass village map with district territories, villager
  portraits, decorations, and chunky 3D buttons.
- **Thought console** - write a thought, get a resident reading with
  confidence, secondary residents, neighbors, a suggested action and a
  compassionate explanation. Earn XP for every reading.
- **Feedback loop** - mark readings correct / partly / wrong and pick the real
  resident. The village learns and resident power shifts.
- **Village map** - a React Flow board of all 79 residents across 11 districts.
  Active residents glow with ✨; click any villager for details and their
  recent thoughts.
- **Analytics (Hall of Records)** - power trends over 14 days, top residents
  this week, reading accuracy, district activity, streak and awareness level.
- **Works without an API key** - a built-in TypeScript prediction engine
  ("the village intuition") is used when DeepSeek is unavailable.

---

## Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Framework  | Next.js 14 (App Router) + TypeScript |
| Styling    | Tailwind CSS + shadcn/ui-style components (`components/ui`) |
| Database   | Prisma ORM - SQLite in dev, PostgreSQL in prod |
| Auth       | NextAuth.js (Google OAuth) + Prisma adapter, DB sessions |
| Graph      | React Flow (`@xyflow/react`) |
| Charts     | Recharts |
| Animation  | Framer Motion |
| Prediction | Jev by TypeSafe (typed decisions) -> DeepSeek V4.1 Flash -> local fallback |

---

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (tested on Node 24)
- A Google account (for OAuth credentials)

### 2. Install

```bash
npm install
```

### 3. Environment

Copy `.env.example` to `.env`. Only `DATABASE_URL` and `NEXTAUTH_SECRET` are
needed to run locally - Google OAuth and DeepSeek are optional:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
JEV_API_KEY=""
JEV_API_URL=""
JEV_MODEL="jev-latest"
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_MODEL="deepseek-v4.1-flash"
```

`JEV_API_KEY` and `DEEPSEEK_API_KEY` are optional - without them the app uses
the local prediction engine. `GOOGLE_CLIENT_ID/SECRET` are optional too -
visitors can play without an account; sign-in only adds progress saving.

### 4. Google OAuth (optional)

Only needed if you want visitors to be able to save their progress.

1. Open the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID** of type *Web application*.
3. Add an authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
4. Copy the client ID and secret into `.env`.

### 5. Database

```bash
npx prisma migrate dev --name init   # creates dev.db + runs the seed
npm run db:seed                      # optional - re-run the seed any time
```

The seed creates all **79 residents** and **486 neighborhood links**
(strong within districts, moderate across related districts).

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and press **Play as
Visitor**. No login required.

---

## Visitor mode

The village is open to everyone. When someone enters `/app`, middleware issues a
`village_guest` cookie (a "guest pass") and the app lazily creates an anonymous
`User` row tied to it. Visitors get the full experience - analyzing thoughts,
feedback, power, map, analytics - and their data stays private to that browser.

If the visitor later signs in with Google, the NextAuth `signIn` event calls
`transferGuestData()` (in `lib/guest.ts`): all thoughts and resident power move
onto the real account, daily power rows are merged, and the guest row is
deleted. Progress is never lost.

---

## How prediction works

`POST /api/analyze` runs the thought through the engine chain in
`lib/engine.ts`:

1. **Jev by TypeSafe AI** (`lib/jev.ts`) - preferred. Jev is not a chat model:
   it takes a `state` (the thought) plus typed `questions` and returns typed,
   calibrated answers with probabilities. The village asks four questions in
   one round trip:
   - `primary_resident` - a `choice` over all 79 residents
   - `secondary_resident` - a `choice` over all residents + `none`
   - `suggested_action` - a `choice` over increase/decrease/redirect/sleep
   - `safety_crisis` - a `noul` (calibrated yes/no) gate for self-harm language

   Keys starting with `jv_live_` automatically use the hosted gateway
   (`https://jevtypesafeai.com/api/v1/decide`); any other key uses the official
   endpoint (`https://api.typesafe.ai/v1/systemone`). Override with
   `JEV_API_URL` for compatible hosts (OpenRouter, DigitalOcean, Vercel).
2. **DeepSeek V4.1 Flash** (`lib/deepseek.ts`) - if Jev is unavailable, the
   thought goes to DeepSeek with a strict JSON contract. The response is
   sanitized: any resident name that is not an exact match from the database is
   rejected, so the UI can never display a hallucinated part.
3. **Local intuition** (`lib/predictor.ts`) - if both APIs are missing or
   fail, the built-in TypeScript engine scores the thought against a curated
   lexicon for every resident.

The reading is stored on the `Thought` record (with a `source` of `jev`,
`deepseek` or `local` - shown on the result card), neighbors are merged with
the strongest graph edges from the database, and resident power gets a small
activity bump. Feedback (correct/partial/wrong) applies larger power
adjustments so your village map reflects reality over time.

A gentle safety note is appended to the reasoning if a thought mentions
self-harm - either from keyword matching or from Jev's calibrated `noul` gate.

---

## API routes

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| POST | `/api/analyze` | viewer | Analyze a thought, save it, return the reading |
| GET | `/api/thoughts` | viewer | Last 50 thoughts with residents |
| POST | `/api/thoughts/:id/feedback` | viewer | Correct a reading, adjust resident power |
| GET | `/api/residents` | public | All residents grouped by district |
| GET | `/api/village` | viewer | Power map, recent thoughts, neighborhood graph |
| GET | `/api/analytics` | viewer | Trends, top residents, accuracy, streak |
| * | `/api/auth/[...nextauth]` | - | NextAuth (Google, optional) |

"viewer" = signed-in user **or** visitor with a guest pass.

---

## Project structure

```
app/
  page.tsx                 # landing
  about/page.tsx           # philosophy + 6-step protocol
  login/page.tsx           # Google sign-in
  app/                     # protected shell (header + nav)
    page.tsx               # thought console
    village/page.tsx       # React Flow map
    analytics/page.tsx     # charts
  api/                     # route handlers
components/
  ui/                      # shadcn-style primitives
  thought-console.tsx      # input + result + history
  result-card.tsx          # reading + feedback
  village-canvas.tsx       # React Flow visualization
  analytics-view.tsx       # Recharts dashboard
lib/
  auth.ts                  # NextAuth options (+ guest transfer on sign-in)
  guest.ts                 # visitor guest-pass + progress transfer
  engine.ts                # prediction chain: Jev -> DeepSeek -> local
  jev.ts                   # Jev by TypeSafe (typed decision API)
  deepseek.ts              # DeepSeek integration + sanitization
  predictor.ts             # local prediction engine + lexicon
  residents.ts             # districts, colors, emojis, actions
  power.ts                 # resident power bookkeeping
  stats.ts                 # streak / level / accuracy
  prisma.ts                # Prisma singleton
prisma/
  schema.prisma            # data model
  seed.ts                  # 79 residents + 486 links
middleware.ts              # issues the visitor guest pass for /app/*
```

---

## Scripts

```bash
npm run dev         # start dev server
npm run build       # production build
npm run start       # serve production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run db:migrate  # prisma migrate dev
npm run db:seed     # seed residents + neighborhoods
npm run db:studio   # prisma studio
```

---

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Provision a PostgreSQL database (Vercel Postgres, Neon, Supabase, ...).
3. In `prisma/schema.prisma`, change the datasource provider to
   `postgresql` (the `Json` columns work on both SQLite and PostgreSQL).
4. Set the environment variables in Vercel:
   - `DATABASE_URL` (Postgres connection string)
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional - needed for sign-in)
   - `DEEPSEEK_API_KEY` (optional)
5. Add the production redirect URI in Google Cloud Console:
   `https://your-domain.com/api/auth/callback/google`
6. Run the migration + seed against the production database once:

   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   DATABASE_URL="<prod-url>" npx tsx prisma/seed.ts
   ```

7. Deploy. The build command is `prisma generate && next build` (the
   `postinstall` hook already runs `prisma generate`).

---

## A note on tone

The Village is a self-reflection tool, not medical advice or therapy. It never
shames a resident - every part of you is doing a job, and the goal is to lead
them consciously. If you are in crisis, please reach out to a professional or
someone you trust.
