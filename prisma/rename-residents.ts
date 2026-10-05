import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

try {
  (
    process as unknown as { loadEnvFile?: (path: string) => void }
  ).loadEnvFile?.(".env");
} catch {
  // ignore
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// One-time vocabulary migration: role-based names become psychological-state
// names. The rename happens IN PLACE (IDs are preserved), so every thought,
// bond and power row keeps pointing at the same resident. Safe to re-run:
// entries whose old name no longer exists are skipped.
const RENAMES: {
  from: string;
  to: string;
  function: string;
  shadow: string;
}[] = [
  // COGNITIVE
  { from: "The Thinker", to: "The Thinking Mind", function: "Analyzes, reflects", shadow: "Overthinking, paralysis" },
  { from: "The Philosopher", to: "The Meaning-Seeking Mind", function: "Seeks meaning, patterns", shadow: "Detachment, nihilism" },
  { from: "The Learner", to: "The Growing Mind", function: "Curious, grows", shadow: "Perfectionism, never enough" },
  { from: "The Planner", to: "The Planning Mind", function: "Organizes future", shadow: "Anxiety, control" },
  { from: "The Analyst", to: "The Dissecting Mind", function: "Breaks down problems", shadow: "Coldness, over-calculation" },
  { from: "The Strategist", to: "The Long-Game Mind", function: "Long-term thinking", shadow: "Manipulation" },
  { from: "The Problem-Solver", to: "The Fixing Mind", function: "Fixes things", shadow: "Can't rest" },
  { from: "The Questioner", to: "The Doubting Mind", function: "Asks why", shadow: "Doubt, cynicism" },

  // PROFESSIONAL
  { from: "The Employee", to: "The Duty-Bound Mind", function: "Does the work, earns", shadow: "Fear of job loss, blame" },
  { from: "The Topper", to: "The Comparing Mind", function: "Achieves, competes", shadow: "Comparison, never 1st enough" },
  { from: "The Genius", to: "The Needing-to-Shine Mind", function: "Creates, innovates", shadow: "Needs recognition" },
  { from: "The Professional", to: "The Standard-Keeping Mind", function: "Delivers, reliably", shadow: "Burnout" },
  { from: "The Leader", to: "The Steering Mind", function: "Guides others", shadow: "Ego, control" },
  { from: "The Follower", to: "The Yielding Mind", function: "Supports, cooperates", shadow: "Passivity" },
  { from: "The Entrepreneur", to: "The Risk-Taking Mind", function: "Builds, risks", shadow: "Greed, overreach" },
  { from: "The Craftsman", to: "The Perfecting Mind", function: "Masters skill", shadow: "Perfectionism" },

  // MONEY
  { from: "The Trader", to: "The Calculating Mind", function: "Calculates worth", shadow: "Gambling, greed" },
  { from: "The Gambler", to: "The Risk-Chasing Mind", function: "Chases risk", shadow: "Ruin, addiction" },
  { from: "The Saver", to: "The Hoarding Mind", function: "Protects, conserves", shadow: "Fear of loss, rigidity" },
  { from: "The Spender", to: "The Craving Mind", function: "Enjoys, consumes", shadow: "Impulse, waste" },
  { from: "The Investor", to: "The Compounding Mind", function: "Grows wealth", shadow: "Impatience" },
  { from: "The Debtor", to: "The Owing Mind", function: "Owes, repays", shadow: "Shame, fear" },
  { from: "The Provider", to: "The Carrying Mind", function: "Feeds family", shadow: "Burden, exhaustion" },

  // RELATIONAL
  { from: "The Friend", to: "The Connecting One", function: "Connects, supports", shadow: "Loss, grief" },
  { from: "The Lover", to: "The Bonding One", function: "Bonds, desires", shadow: "Obsession, jealousy" },
  { from: "The Family Man", to: "The Kin-Keeper", function: "Cares for kin", shadow: "Duty, resentment" },
  { from: "The Son", to: "The Obedient One", function: "Honors parents", shadow: "Guilt, obligation" },
  { from: "The Husband", to: "The Partnering One", function: "Partners", shadow: "Distance, unmet needs" },
  { from: "The Social Man", to: "The Image-Conscious Mind", function: "Belongs, status", shadow: "Comparison, image" },
  { from: "The Lonely One", to: "The Longing One", function: "Seeks connection", shadow: "Isolation, despair" },
  { from: "The Helper", to: "The Rescuing Mind", function: "Serves others", shadow: "Martyrdom" },

  // EMOTIONAL
  { from: "The Sad One", to: "The Grieving One", function: "Grief, release", shadow: "Depression" },
  { from: "The Depressive", to: "The Heavy One", function: "Rest, withdrawal", shadow: "Hopelessness" },
  { from: "The Anxious One", to: "The Threat-Scanning Mind", function: "Anticipates threat", shadow: "Chronic worry" },

  // CREATIVE
  { from: "The Artist", to: "The Beauty-Making Mind", function: "Creates beauty", shadow: "Insecurity" },
  { from: "The Writer", to: "The Expressing Mind", function: "Expresses, records", shadow: "Block, self-doubt" },
  { from: "The Musician", to: "The Rhythmic Mind", function: "Feels rhythm", shadow: "Mood swings" },
  { from: "The Builder", to: "The Making Mind", function: "Makes things", shadow: "Obsession" },
  { from: "The Dreamer", to: "The Imagining Mind", function: "Imagines", shadow: "Escapism" },
  { from: "The Player", to: "The Playing One", function: "Plays, enjoys", shadow: "Avoidance" },

  // BODY
  { from: "The Athlete", to: "The Training Mind", function: "Moves, trains", shadow: "Injury, exhaustion" },
  { from: "The Sleeper", to: "The Resting One", function: "Restores", shadow: "Lethargy" },
  { from: "The Eater", to: "The Nourishing One", function: "Nourishes", shadow: "Binge, restriction" },
  { from: "The Addict", to: "The Numbing Mind", function: "Seeks relief", shadow: "Destruction" },
  { from: "The Healthy One", to: "The Maintaining One", function: "Maintains", shadow: "Rigidity" },

  // PRIMAL
  { from: "The Hunter", to: "The Pursuing One", function: "Pursues, provides", shadow: "Aggression" },
  { from: "The Prey", to: "The Fleeing One", function: "Flees, hides", shadow: "Victimhood" },
  { from: "The Beast", to: "The Instinctive One", function: "Raw instinct", shadow: "Violence, lust" },

  // DESTRUCTIVE
  { from: "The Saboteur", to: "The Self-Undoing Mind", function: "Self-sabotage", shadow: "" },
  { from: "The Critic", to: "The Judging Mind", function: "Constant judgment", shadow: "" },
  { from: "The Cynic", to: "The Bitter Mind", function: "Bitterness", shadow: "" },
  { from: "The Manipulator", to: "The Steering-Others Mind", function: "Control", shadow: "" },
  { from: "The Liar", to: "The Hiding Mind", function: "Deception", shadow: "" },
  { from: "The Coward", to: "The Avoiding Mind", function: "Avoidance", shadow: "" },
  { from: "The Tyrant", to: "The Dominating Mind", function: "Domination", shadow: "" },
];

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

async function main() {
  let renamed = 0;

  for (const entry of RENAMES) {
    const resident = await prisma.resident.findUnique({
      where: { name: entry.from },
    });
    if (!resident) continue; // already renamed, or fresh seed

    const base = `${entry.to} ${lowerFirst(entry.function)} - the ${resident.district.toLowerCase()} part of you.`;
    const description = entry.shadow
      ? `${base} When it takes over, its shadow shows as ${entry.shadow.toLowerCase()}.`
      : `${base} A resident to be led consciously, never obeyed blindly.`;

    await prisma.resident.update({
      where: { id: resident.id },
      data: {
        name: entry.to,
        function: entry.function,
        shadow: entry.shadow,
        description,
      },
    });
    renamed += 1;
  }

  console.log(
    `Renamed ${renamed} residents in place (${RENAMES.length - renamed} skipped).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
