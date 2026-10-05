import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedResident = {
  name: string;
  district: string;
  function: string;
  shadow: string;
};

// ---------------------------------------------------------------------------
// The complete village - 79 residents across 11 districts.
// Relationships are NOT predefined: every user builds their own village by
// agreeing (or disagreeing) with the surrounding residents Jev suggests.
// ---------------------------------------------------------------------------

const RESIDENTS: SeedResident[] = [
  // COGNITIVE
  { name: "The Thinker", district: "Cognitive", function: "Analyzes, reflects", shadow: "Overthinking, paralysis" },
  { name: "The Philosopher", district: "Cognitive", function: "Seeks meaning, patterns", shadow: "Detachment, nihilism" },
  { name: "The Learner", district: "Cognitive", function: "Curious, grows", shadow: "Perfectionism, never enough" },
  { name: "The Planner", district: "Cognitive", function: "Organizes future", shadow: "Anxiety, control" },
  { name: "The Analyst", district: "Cognitive", function: "Breaks down problems", shadow: "Coldness, over-calculation" },
  { name: "The Strategist", district: "Cognitive", function: "Long-term thinking", shadow: "Manipulation" },
  { name: "The Problem-Solver", district: "Cognitive", function: "Fixes things", shadow: "Can't rest" },
  { name: "The Questioner", district: "Cognitive", function: "Asks why", shadow: "Doubt, cynicism" },

  // PROFESSIONAL
  { name: "The Employee", district: "Professional", function: "Does the work, earns", shadow: "Fear of job loss, blame" },
  { name: "The Topper", district: "Professional", function: "Achieves, competes", shadow: "Comparison, never 1st enough" },
  { name: "The Genius", district: "Professional", function: "Creates, innovates", shadow: "Needs recognition" },
  { name: "The Professional", district: "Professional", function: "Delivers, reliable", shadow: "Burnout" },
  { name: "The Leader", district: "Professional", function: "Guides others", shadow: "Ego, control" },
  { name: "The Follower", district: "Professional", function: "Supports, cooperates", shadow: "Passivity" },
  { name: "The Entrepreneur", district: "Professional", function: "Builds, risks", shadow: "Greed, overreach" },
  { name: "The Craftsman", district: "Professional", function: "Masters skill", shadow: "Perfectionism" },

  // MONEY
  { name: "The Trader", district: "Money", function: "Calculates worth", shadow: "Gambling, greed" },
  { name: "The Gambler", district: "Money", function: "Chases risk", shadow: "Ruin, addiction" },
  { name: "The Saver", district: "Money", function: "Protects, conserves", shadow: "Hoarding, fear" },
  { name: "The Spender", district: "Money", function: "Enjoys, consumes", shadow: "Impulse, waste" },
  { name: "The Investor", district: "Money", function: "Grows wealth", shadow: "Impatience" },
  { name: "The Debtor", district: "Money", function: "Owes, repays", shadow: "Shame, fear" },
  { name: "The Provider", district: "Money", function: "Feeds family", shadow: "Burden, exhaustion" },

  // RELATIONAL
  { name: "The Friend", district: "Relational", function: "Connects, supports", shadow: "Loss, grief" },
  { name: "The Lover", district: "Relational", function: "Bonds, desires", shadow: "Obsession, jealousy" },
  { name: "The Family Man", district: "Relational", function: "Cares for kin", shadow: "Duty, resentment" },
  { name: "The Son", district: "Relational", function: "Honors parents", shadow: "Guilt, obligation" },
  { name: "The Husband", district: "Relational", function: "Partners", shadow: "Distance, unmet needs" },
  { name: "The Parent", district: "Relational", function: "Nurtures", shadow: "Worry, control" },
  { name: "The Social Man", district: "Relational", function: "Belongs, status", shadow: "Comparison, image" },
  { name: "The Lonely One", district: "Relational", function: "Seeks connection", shadow: "Isolation, despair" },
  { name: "The Helper", district: "Relational", function: "Serves others", shadow: "Martyrdom" },

  // EMOTIONAL
  { name: "The Happy One", district: "Emotional", function: "Joy, lightness", shadow: "Avoidance" },
  { name: "The Sad One", district: "Emotional", function: "Grief, release", shadow: "Depression" },
  { name: "The Angry One", district: "Emotional", function: "Boundary, fire", shadow: "Rage, destruction" },
  { name: "The Fearful One", district: "Emotional", function: "Caution, safety", shadow: "Paralysis, anxiety" },
  { name: "The Depressive", district: "Emotional", function: "Rest, withdrawal", shadow: "Hopelessness" },
  { name: "The Anxious One", district: "Emotional", function: "Anticipates threat", shadow: "Chronic worry" },
  { name: "The Content One", district: "Emotional", function: "Peace, enough", shadow: "Complacency" },
  { name: "The Envious One", district: "Emotional", function: "Comparison, desire", shadow: "Resentment" },
  { name: "The Guilty One", district: "Emotional", function: "Conscience", shadow: "Shame, self-punishment" },
  { name: "The Ashamed One", district: "Emotional", function: "Social awareness", shadow: "Self-hatred" },

  // CREATIVE
  { name: "The Artist", district: "Creative", function: "Creates beauty", shadow: "Insecurity" },
  { name: "The Writer", district: "Creative", function: "Expresses, records", shadow: "Block, self-doubt" },
  { name: "The Musician", district: "Creative", function: "Feels rhythm", shadow: "Mood swings" },
  { name: "The Builder", district: "Creative", function: "Makes things", shadow: "Obsession" },
  { name: "The Dreamer", district: "Creative", function: "Imagines", shadow: "Escapism" },
  { name: "The Player", district: "Creative", function: "Plays, enjoys", shadow: "Avoidance" },

  // BODY
  { name: "The Athlete", district: "Body", function: "Moves, trains", shadow: "Injury, exhaustion" },
  { name: "The Sleeper", district: "Body", function: "Restores", shadow: "Lethargy" },
  { name: "The Eater", district: "Body", function: "Nourishes", shadow: "Binge, restriction" },
  { name: "The Addict", district: "Body", function: "Seeks relief", shadow: "Destruction" },
  { name: "The Healthy One", district: "Body", function: "Maintains", shadow: "Rigidity" },
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
  { name: "The Hunter", district: "Primal", function: "Pursues, provides", shadow: "Aggression" },
  { name: "The Protector", district: "Primal", function: "Defends", shadow: "Paranoia" },
  { name: "The Prey", district: "Primal", function: "Flees, hides", shadow: "Victimhood" },
  { name: "The Beast", district: "Primal", function: "Raw instinct", shadow: "Violence, lust" },
  { name: "The Child", district: "Primal", function: "Innocent, playful", shadow: "Vulnerability, fear" },

  // DESTRUCTIVE
  { name: "The Saboteur", district: "Destructive", function: "Self-sabotage", shadow: "" },
  { name: "The Critic", district: "Destructive", function: "Constant judgment", shadow: "" },
  { name: "The Cynic", district: "Destructive", function: "Bitterness", shadow: "" },
  { name: "The Manipulator", district: "Destructive", function: "Control", shadow: "" },
  { name: "The Liar", district: "Destructive", function: "Deception", shadow: "" },
  { name: "The Coward", district: "Destructive", function: "Avoidance", shadow: "" },
  { name: "The Tyrant", district: "Destructive", function: "Domination", shadow: "" },

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
