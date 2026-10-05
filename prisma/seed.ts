import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Allow running this script directly (npx tsx prisma/seed.ts) as well as
// through `prisma db seed` (which already loads .env).
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

type SeedResident = {
  name: string;
  district: string;
  function: string;
  shadow: string;
};

// ---------------------------------------------------------------------------
// The complete village - 79 residents across 11 districts.
// Names describe psychological STATES (not social roles), so a reading like
// "The Comparing Mind, shadow mode" is instantly recognizable.
// Relationships are NOT predefined: every user builds their own village by
// agreeing (or disagreeing) with the surrounding residents Jev suggests.
// ---------------------------------------------------------------------------

const RESIDENTS: SeedResident[] = [
  // COGNITIVE
  { name: "The Thinking Mind", district: "Cognitive", function: "Analyzes, reflects", shadow: "Overthinking, paralysis" },
  { name: "The Meaning-Seeking Mind", district: "Cognitive", function: "Seeks meaning, patterns", shadow: "Detachment, nihilism" },
  { name: "The Growing Mind", district: "Cognitive", function: "Curious, grows", shadow: "Perfectionism, never enough" },
  { name: "The Planning Mind", district: "Cognitive", function: "Organizes future", shadow: "Anxiety, control" },
  { name: "The Dissecting Mind", district: "Cognitive", function: "Breaks down problems", shadow: "Coldness, over-calculation" },
  { name: "The Long-Game Mind", district: "Cognitive", function: "Long-term thinking", shadow: "Manipulation" },
  { name: "The Fixing Mind", district: "Cognitive", function: "Fixes things", shadow: "Can't rest" },
  { name: "The Doubting Mind", district: "Cognitive", function: "Asks why", shadow: "Doubt, cynicism" },

  // PROFESSIONAL
  { name: "The Duty-Bound Mind", district: "Professional", function: "Does the work, earns", shadow: "Fear of job loss, blame" },
  { name: "The Comparing Mind", district: "Professional", function: "Achieves, competes", shadow: "Comparison, never 1st enough" },
  { name: "The Needing-to-Shine Mind", district: "Professional", function: "Creates, innovates", shadow: "Needs recognition" },
  { name: "The Standard-Keeping Mind", district: "Professional", function: "Delivers, reliably", shadow: "Burnout" },
  { name: "The Steering Mind", district: "Professional", function: "Guides others", shadow: "Ego, control" },
  { name: "The Yielding Mind", district: "Professional", function: "Supports, cooperates", shadow: "Passivity" },
  { name: "The Risk-Taking Mind", district: "Professional", function: "Builds, risks", shadow: "Greed, overreach" },
  { name: "The Perfecting Mind", district: "Professional", function: "Masters skill", shadow: "Perfectionism" },

  // MONEY
  { name: "The Calculating Mind", district: "Money", function: "Calculates worth", shadow: "Gambling, greed" },
  { name: "The Risk-Chasing Mind", district: "Money", function: "Chases risk", shadow: "Ruin, addiction" },
  { name: "The Hoarding Mind", district: "Money", function: "Protects, conserves", shadow: "Fear of loss, rigidity" },
  { name: "The Craving Mind", district: "Money", function: "Enjoys, consumes", shadow: "Impulse, waste" },
  { name: "The Compounding Mind", district: "Money", function: "Grows wealth", shadow: "Impatience" },
  { name: "The Owing Mind", district: "Money", function: "Owes, repays", shadow: "Shame, fear" },
  { name: "The Carrying Mind", district: "Money", function: "Feeds family", shadow: "Burden, exhaustion" },

  // RELATIONAL
  { name: "The Connecting One", district: "Relational", function: "Connects, supports", shadow: "Loss, grief" },
  { name: "The Bonding One", district: "Relational", function: "Bonds, desires", shadow: "Obsession, jealousy" },
  { name: "The Kin-Keeper", district: "Relational", function: "Cares for kin", shadow: "Duty, resentment" },
  { name: "The Obedient One", district: "Relational", function: "Honors parents", shadow: "Guilt, obligation" },
  { name: "The Partnering One", district: "Relational", function: "Partners", shadow: "Distance, unmet needs" },
  { name: "The Parent", district: "Relational", function: "Nurtures", shadow: "Worry, control" },
  { name: "The Image-Conscious Mind", district: "Relational", function: "Belongs, status", shadow: "Comparison, image" },
  { name: "The Longing One", district: "Relational", function: "Seeks connection", shadow: "Isolation, despair" },
  { name: "The Rescuing Mind", district: "Relational", function: "Serves others", shadow: "Martyrdom" },

  // EMOTIONAL
  { name: "The Happy One", district: "Emotional", function: "Joy, lightness", shadow: "Avoidance" },
  { name: "The Grieving One", district: "Emotional", function: "Grief, release", shadow: "Depression" },
  { name: "The Angry One", district: "Emotional", function: "Boundary, fire", shadow: "Rage, destruction" },
  { name: "The Fearful One", district: "Emotional", function: "Caution, safety", shadow: "Paralysis, anxiety" },
  { name: "The Heavy One", district: "Emotional", function: "Rest, withdrawal", shadow: "Hopelessness" },
  { name: "The Threat-Scanning Mind", district: "Emotional", function: "Anticipates threat", shadow: "Chronic worry" },
  { name: "The Content One", district: "Emotional", function: "Peace, enough", shadow: "Complacency" },
  { name: "The Envious One", district: "Emotional", function: "Comparison, desire", shadow: "Resentment" },
  { name: "The Guilty One", district: "Emotional", function: "Conscience", shadow: "Shame, self-punishment" },
  { name: "The Ashamed One", district: "Emotional", function: "Social awareness", shadow: "Self-hatred" },

  // CREATIVE
  { name: "The Beauty-Making Mind", district: "Creative", function: "Creates beauty", shadow: "Insecurity" },
  { name: "The Expressing Mind", district: "Creative", function: "Expresses, records", shadow: "Block, self-doubt" },
  { name: "The Rhythmic Mind", district: "Creative", function: "Feels rhythm", shadow: "Mood swings" },
  { name: "The Making Mind", district: "Creative", function: "Makes things", shadow: "Obsession" },
  { name: "The Imagining Mind", district: "Creative", function: "Imagines", shadow: "Escapism" },
  { name: "The Playing One", district: "Creative", function: "Plays, enjoys", shadow: "Avoidance" },

  // BODY
  { name: "The Training Mind", district: "Body", function: "Moves, trains", shadow: "Injury, exhaustion" },
  { name: "The Resting One", district: "Body", function: "Restores", shadow: "Lethargy" },
  { name: "The Nourishing One", district: "Body", function: "Nourishes", shadow: "Binge, restriction" },
  { name: "The Numbing Mind", district: "Body", function: "Seeks relief", shadow: "Destruction" },
  { name: "The Maintaining One", district: "Body", function: "Maintains", shadow: "Rigidity" },
  { name: "The Sensitive One", district: "Body", function: "Feels body", shadow: "Overwhelm" },

  // SPIRITUAL
  { name: "The Witness", district: "Spiritual", function: "Observes all", shadow: "Detachment" },
  { name: "The Seeker", district: "Spiritual", function: "Searches truth", shadow: "Never arrives" },
  { name: "The Mystic", district: "Spiritual", function: "Experiences unity", shadow: "Bypass" },
  { name: "The Monk", district: "Spiritual", function: "Renounces", shadow: "Isolation" },
  { name: "The Praying One", district: "Spiritual", function: "Surrenders", shadow: "Guilt" },
  { name: "The Gratitude One", district: "Spiritual", function: "Thanks, appreciates", shadow: "Naivety" },

  // PRIMAL
  { name: "The Survivor", district: "Primal", function: "Fights, endures", shadow: "Hypervigilance" },
  { name: "The Pursuing One", district: "Primal", function: "Pursues, provides", shadow: "Aggression" },
  { name: "The Protector", district: "Primal", function: "Defends", shadow: "Paranoia" },
  { name: "The Fleeing One", district: "Primal", function: "Flees, hides", shadow: "Victimhood" },
  { name: "The Instinctive One", district: "Primal", function: "Raw instinct", shadow: "Violence, lust" },
  { name: "The Child", district: "Primal", function: "Innocent, playful", shadow: "Vulnerability, fear" },

  // DESTRUCTIVE
  { name: "The Self-Undoing Mind", district: "Destructive", function: "Self-sabotage", shadow: "" },
  { name: "The Judging Mind", district: "Destructive", function: "Constant judgment", shadow: "" },
  { name: "The Bitter Mind", district: "Destructive", function: "Bitterness", shadow: "" },
  { name: "The Steering-Others Mind", district: "Destructive", function: "Control", shadow: "" },
  { name: "The Hiding Mind", district: "Destructive", function: "Deception", shadow: "" },
  { name: "The Avoiding Mind", district: "Destructive", function: "Avoidance", shadow: "" },
  { name: "The Dominating Mind", district: "Destructive", function: "Domination", shadow: "" },

  // HIGHER
  { name: "The Wise One", district: "Higher", function: "Sees clearly", shadow: "" },
  { name: "The Compassionate One", district: "Higher", function: "Loves all", shadow: "" },
  { name: "The Courageous One", district: "Higher", function: "Acts despite fear", shadow: "" },
  { name: "The Just One", district: "Higher", function: "Fair, ethical", shadow: "" },
  { name: "The Humble One", district: "Higher", function: "Grounded", shadow: "" },
  { name: "The Free One", district: "Higher", function: "Unbound", shadow: "" },
];

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function buildDescription(r: SeedResident) {
  const base = `${r.name} ${lowerFirst(r.function)} - the ${r.district.toLowerCase()} part of you.`;
  if (!r.shadow) {
    return `${base} A resident to be led consciously, never obeyed blindly.`;
  }
  return `${base} When it takes over, its shadow shows as ${r.shadow.toLowerCase()}.`;
}

async function main() {
  console.log("Seeding The Village...");

  // Residents only. No predefined relationships - each user's bonds are
  // earned through readings and their own agree/disagree choices.
  for (const r of RESIDENTS) {
    const description = buildDescription(r);
    await prisma.resident.upsert({
      where: { name: r.name },
      update: {
        district: r.district,
        function: r.function,
        shadow: r.shadow,
        description,
      },
      create: { ...r, description },
    });
  }

  // Clean out any predefined relationships from older seeds.
  await prisma.neighborhood.deleteMany({});

  console.log(
    `Seeded ${RESIDENTS.length} residents. Bonds are earned through readings.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
