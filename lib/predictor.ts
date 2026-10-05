// The Village - local prediction engine ("the village intuition").
//
// When no DeepSeek API key is configured (or the API is unreachable), this
// pure-TypeScript engine identifies the most likely resident behind a thought
// using a curated lexicon, district priors and simple scoring. It always works
// offline, which keeps the app fully playable without any external service.

import {
  ACTION_META,
  DISTRICT_META,
  type District,
  type ResidentLite,
  type SuggestedAction,
} from "./residents";
import { clamp } from "./utils";

export type NeighborSuggestion = {
  name: string;
  confidence: number;
  reason: string;
};

export type Prediction = {
  primary_resident: string;
  confidence: number;
  secondary_residents: { name: string; confidence: number }[];
  neighbors: NeighborSuggestion[];
  suggested_action: SuggestedAction;
  reasoning: string;
};

// ---------------------------------------------------------------------------
// Safety first: if a thought mentions self-harm we add a gentle, human note.
// ---------------------------------------------------------------------------

const SAFETY_PATTERN =
  /\b(kill myself|suicide|suicidal|end my life|self[- ]?harm|hurt myself|no reason to live|better off dead|don't want to live)\b/i;

export function safetyNote(text: string): string | null {
  if (!SAFETY_PATTERN.test(text)) return null;
  return "This sounds heavy, and you deserve real support with it - more than any app can give. Please consider reaching out to someone you trust, or a professional or helpline today. The village can wait.";
}

// ---------------------------------------------------------------------------
// Lexicon - cues that point to each resident.
// ---------------------------------------------------------------------------

const LEXICON: Record<string, string[]> = {
  // COGNITIVE
  "The Thinker": ["think", "thinking", "thoughts", "overthink", "overthinking", "ruminate", "rumination", "in my head", "racing mind", "mind won't stop", "mental"],
  "The Philosopher": ["meaning", "meaning of life", "purpose", "existential", "why are we here", "absurd", "universe", "nihilism", "philosophy", "philosophical"],
  "The Learner": ["learn", "learning", "study", "studying", "course", "skill", "practice", "improve", "tutorial", "beginner", "not smart enough"],
  "The Planner": ["plan", "planning", "schedule", "tomorrow", "future", "prepare", "calendar", "organize", "organized", "goals", "timeline"],
  "The Analyst": ["analyze", "analysis", "data", "numbers", "metrics", "break down", "logic", "logical", "spreadsheet", "measure", "optimize"],
  "The Strategist": ["strategy", "strategic", "long game", "long-term", "leverage", "position", "advantage", "outsmart", "chess", "plan b"],
  "The Problem-Solver": ["fix", "fixing", "solve", "solving", "solution", "problem", "issue", "broken", "workaround", "debug", "figure it out"],
  "The Questioner": ["why", "question", "questioning", "doubt", "doubts", "skeptical", "is it true", "cynical", "sure about"],

  // PROFESSIONAL
  "The Employee": ["job", "boss", "office", "meeting", "deadline", "salary", "workload", "fired", "layoff", "manager", "colleagues", "appraisal", "corporate", "promotion", "raise", "overworked"],
  "The Topper": ["topper", "rank", "ranked", "first", "exam", "marks", "score", "compete", "competition", "better than", "medal", "second place", "grades"],
  "The Genius": ["genius", "brilliant", "innovate", "innovation", "invent", "genius idea", "recognition", "recognized", "talent", "gifted", "credit for"],
  "The Professional": ["professional", "client", "deliver", "deliverable", "project", "reputation", "standard", "reliable", "burnout", "burned out", "on call"],
  "The Leader": ["lead", "leader", "team", "guide", "mentor", "responsibility", "delegate", "decision", "in charge", "looks to me"],
  "The Follower": ["follow", "following", "instructions", "obey", "cooperate", "support", "agree", "go along", "no opinion", "whatever they say"],
  "The Entrepreneur": ["startup", "business", "founder", "launch", "entrepreneur", "customers", "revenue", "scale", "venture", "my company", "risk it all"],
  "The Craftsman": ["craft", "mastery", "master", "quality", "detail", "details", "perfect the", "polish", "handmade", "my craft", "workmanship"],

  // MONEY
  "The Trader": ["trade", "trading", "market", "markets", "stocks", "portfolio", "chart", "price", "worth", "valuation", "buy the dip"],
  "The Gambler": ["bet", "betting", "gamble", "gambling", "luck", "lottery", "casino", "risk it", "double or nothing", "one more round", "chase losses"],
  "The Saver": ["save", "saving", "savings", "budget", "frugal", "emergency fund", "hoard", "hoarding", "cheap", "afford", "cut costs", "money runs out"],
  "The Spender": ["spend", "spending", "buy", "bought", "shopping", "splurge", "treat myself", "purchase", "retail", "sale", "upgrade"],
  "The Investor": ["invest", "investing", "investment", "compound", "returns", "long term wealth", "mutual fund", "sip", "assets", "wealth", "patience"],
  "The Debtor": ["debt", "loan", "emi", "owe", "owed", "repay", "repayment", "borrow", "borrowed", "credit card", "installment", "bills pile"],
  "The Provider": ["provide", "provider", "family expenses", "bills", "breadwinner", "feed", "school fees", "rent", "support the family", "money for home"],

  // RELATIONAL
  "The Friend": ["friend", "friends", "friendship", "buddy", "hang out", "catch up", "companionship", "my people"],
  "The Lover": ["love", "lover", "romance", "romantic", "desire", "crush", "intimacy", "kiss", "attraction", "my partner", "jealous", "obsessed with", "my ex", "ex's", "ex", "heartache"],
  "The Family Man": ["family", "relatives", "kin", "household", "family duties", "family responsibility", "at home"],
  "The Son": ["parents", "mother", "father", "mom", "dad", "my father", "my mother", "respect elders", "their expectations", "family name", "disappoint them"],
  "The Husband": ["wife", "husband", "spouse", "marriage", "married", "anniversary", "my marriage"],
  "The Parent": ["kid", "kids", "children", "child", "son", "daughter", "parenting", "school run", "my child", "raise them", "my daughter", "my son", "my kids", "my baby", "my boy", "my girl", "worry about my", "something will happen to"],
  "The Social Man": ["status", "image", "society", "people think", "reputation", "what will people say", "instagram", "followers", "networking", "impress", "party", "social", "social media", "stalking"],
  "The Lonely One": ["lonely", "alone", "no one", "nobody", "isolated", "isolation", "disconnected", "left out", "no friends", "unwanted"],
  "The Helper": ["help", "helping", "serve", "serving", "volunteer", "rescue", "everyone needs me", "can't say no", "save them", "fix their"],

  // EMOTIONAL
  "The Happy One": ["happy", "joy", "joyful", "excited", "light", "laugh", "fun", "great mood", "celebrate"],
  "The Sad One": ["sad", "cry", "crying", "tears", "grief", "grieving", "sorrow", "melancholy", "heartbroken", "miss them", "miss him", "miss her"],
  "The Angry One": ["angry", "anger", "rage", "furious", "mad", "unfair", "resent", "annoyed", "irritated", "boundary", "how dare"],
  "The Fearful One": ["afraid", "scared", "fear", "fearful", "terrified", "danger", "unsafe", "threat", "frightened"],
  "The Depressive": ["depressed", "depression", "hopeless", "empty", "nothing matters", "can't get up", "can't get out of bed", "no energy", "dark place", "numb", "pointless", "feels pointless", "no point in", "lately"],
  "The Anxious One": ["anxious", "anxiety", "nervous", "worried", "worry", "panic", "what if", "restless", "on edge", "can't relax"],
  "The Content One": ["content", "peaceful", "peace", "enough", "calm", "satisfied", "at ease", "all is well", "settled"],
  "The Envious One": ["envy", "envious", "jealous of", "jealousy", "why not me", "they have", "compare", "comparison", "left behind", "their success"],
  "The Guilty One": ["guilt", "guilty", "should have", "my fault", "regret", "i'm sorry", "let them down", "failed them", "wrong thing"],
  "The Ashamed One": ["shame", "ashamed", "embarrassed", "embarrassing", "humiliated", "humiliation", "not good enough", "unworthy", "worthless", "hide my face"],

  // CREATIVE
  "The Artist": ["art", "artist", "paint", "painting", "draw", "drawing", "beauty", "aesthetic", "creative work", "design", "sketch"],
  "The Writer": ["write", "writing", "writer", "words", "journal", "journaling", "blog", "book", "draft", "blank page", "essay", "story"],
  "The Musician": ["music", "song", "sing", "singing", "guitar", "piano", "melody", "rhythm", "concert", "band", "playlist"],
  "The Builder": ["build", "building", "build something", "prototype", "make things", "construct", "woodwork", "side project", "assemble", "ship it"],
  "The Dreamer": ["imagine", "imagining", "imagination", "fantasy", "someday", "dream", "dreaming", "envision", "escape into", "one day i will"],
  "The Player": ["play", "playing", "game", "gaming", "video game", "cricket", "football match", "have fun", "unwind", "arcade"],

  // BODY
  "The Athlete": ["gym", "run", "running", "workout", "train", "training", "lift", "lifting", "fitness", "marathon", "steps", "sore muscles"],
  "The Sleeper": ["sleep", "sleepy", "tired", "nap", "rest", "exhausted", "insomnia", "can't sleep", "wake up", "bed", "drained"],
  "The Eater": ["eat", "eating", "food", "hunger", "hungry", "craving", "cravings", "diet", "sugar", "meal", "binge", "snack", "fasting"],
  "The Addict": ["addiction", "addicted", "drink", "drinking", "alcohol", "smoke", "smoking", "porn", "scroll", "scrolling", "high", "urge", "relapse", "substance", "one more episode", "can't stop", "compulsive", "one more time"],
  "The Healthy One": ["healthy", "health", "water", "routine", "exercise", "discipline", "balanced", "clean eating", "wellness", "self-care"],
  "The Sensitive One": ["tight chest", "headache", "body", "ache", "aching", "tense", "tension", "pain", "stomach", "shaky", "tingling", "overstimulated"],

  // SPIRITUAL
  "The Witness": ["observe", "observing", "watching", "awareness", "aware", "witness", "notice", "noticing", "step back", "watching my mind"],
  "The Seeker": ["truth", "seek", "seeking", "searching", "spiritual", "spirituality", "path", "awakening", "find myself", "deeper meaning"],
  "The Mystic": ["oneness", "unity", "divine", "transcend", "transcendence", "infinite", "cosmic", "everything is connected", "ego death"],
  "The Monk": ["renounce", "renunciation", "simplicity", "silence", "meditate", "meditation", "retreat", "let go of everything", "monastery", "vow"],
  "The Praying One": ["pray", "prayer", "praying", "god", "surrender", "surrender to", "faith", "grace", "bless", "blessing", "lord"],
  "The Gratitude One": ["grateful", "gratitude", "thankful", "thanks", "appreciate", "appreciation", "blessed", "abundance", "lucky to have", "grateful for", "thankful for"],

  // PRIMAL
  "The Survivor": ["survive", "surviving", "survival", "endure", "get through", "tough it out", "keep going", "hold on", "barely made it", "hypervigilant"],
  "The Hunter": ["hunt", "hunting", "pursue", "pursuing", "chase", "target", "prey", "track", "capture", "conquer"],
  "The Protector": ["protect", "protecting", "defend", "defending", "guard", "shield", "keep them safe", "watch over", "on guard", "watchful"],
  "The Prey": ["hide", "hiding", "flee", "escape", "trap", "trapped", "cornered", "victim", "powerless", "nowhere to go"],
  "The Beast": ["instinct", "primal", "wild", "urge", "lust", "hunger for", "animal", "untamed", "feral", "raw desire"],
  "The Child": ["innocent", "inner child", "little kid", "playful", "wonder", "vulnerable", "small and scared", "hold me"],

  // DESTRUCTIVE
  "The Saboteur": ["sabotage", "sabotaging", "self-destruct", "self-destructing", "ruin it", "ruin everything", "push them away", "mess it up", "blow it up", "destroy my own"],
  "The Critic": ["critic", "critical", "judging", "judgment", "judgmental", "harsh", "flaw", "flaws", "what's wrong with me", "standards", "never satisfied with myself"],
  "The Cynic": ["cynical", "cynicism", "bitter", "bitterness", "pointless", "trust no one", "everyone is fake", "no point", "give up on people"],
  "The Manipulator": ["manipulate", "manipulating", "control them", "control the situation", "game them", "play them", "leverage people", "puppet"],
  "The Liar": ["lie", "lied", "lying", "hide the truth", "hiding the truth", "fake it", "pretend", "deceive", "deceiving", "cover up"],
  "The Coward": ["avoid", "avoiding", "avoidance", "run away", "running away", "procrastinate", "procrastinating", "postpone", "can't face", "dodging"],
  "The Tyrant": ["dominate", "dominating", "domination", "power over", "boss them", "boss around", "force them", "control everything", "my way or", "rule"],

  // HIGHER
  "The Wise One": ["wise", "wisdom", "clarity", "perspective", "understand deeply", "see clearly", "discern", "sage", "know better"],
  "The Compassionate One": ["compassion", "compassionate", "kindness", "kind", "forgive", "forgiveness", "empathy", "warm heart", "love all", "gentle with"],
  "The Courageous One": ["courage", "courageous", "brave", "bravery", "despite fear", "face it", "stand up", "speak up", "do it anyway", "step forward"],
  "The Just One": ["fair", "fairness", "justice", "just", "ethical", "ethics", "integrity", "right thing", "honest", "honesty", "principle"],
  "The Humble One": ["humble", "humility", "grounded", "modest", "ego", "credit others", "learn from", "not above", "admit"],
  "The Free One": ["free", "freedom", "unbound", "let go", "liberated", "liberty", "no chains", "detached from outcome", "release", "unburdened"],
};

// The lexicon and action overrides below are keyed by the ORIGINAL vocabulary
// names. Resident display names were later upgraded to psychological-state
// names (The Topper -> The Comparing Mind, ...), so this map bridges the
// current display name to its lexicon key.
const NAME_ALIASES: Record<string, string> = {
  "The Thinking Mind": "The Thinker",
  "The Meaning-Seeking Mind": "The Philosopher",
  "The Growing Mind": "The Learner",
  "The Planning Mind": "The Planner",
  "The Dissecting Mind": "The Analyst",
  "The Long-Game Mind": "The Strategist",
  "The Fixing Mind": "The Problem-Solver",
  "The Doubting Mind": "The Questioner",
  "The Duty-Bound Mind": "The Employee",
  "The Comparing Mind": "The Topper",
  "The Needing-to-Shine Mind": "The Genius",
  "The Standard-Keeping Mind": "The Professional",
  "The Steering Mind": "The Leader",
  "The Yielding Mind": "The Follower",
  "The Risk-Taking Mind": "The Entrepreneur",
  "The Perfecting Mind": "The Craftsman",
  "The Calculating Mind": "The Trader",
  "The Risk-Chasing Mind": "The Gambler",
  "The Hoarding Mind": "The Saver",
  "The Craving Mind": "The Spender",
  "The Compounding Mind": "The Investor",
  "The Owing Mind": "The Debtor",
  "The Carrying Mind": "The Provider",
  "The Connecting One": "The Friend",
  "The Bonding One": "The Lover",
  "The Kin-Keeper": "The Family Man",
  "The Obedient One": "The Son",
  "The Partnering One": "The Husband",
  "The Image-Conscious Mind": "The Social Man",
  "The Longing One": "The Lonely One",
  "The Rescuing Mind": "The Helper",
  "The Grieving One": "The Sad One",
  "The Heavy One": "The Depressive",
  "The Threat-Scanning Mind": "The Anxious One",
  "The Beauty-Making Mind": "The Artist",
  "The Expressing Mind": "The Writer",
  "The Rhythmic Mind": "The Musician",
  "The Making Mind": "The Builder",
  "The Imagining Mind": "The Dreamer",
  "The Playing One": "The Player",
  "The Training Mind": "The Athlete",
  "The Resting One": "The Sleeper",
  "The Nourishing One": "The Eater",
  "The Numbing Mind": "The Addict",
  "The Maintaining One": "The Healthy One",
  "The Pursuing One": "The Hunter",
  "The Fleeing One": "The Prey",
  "The Instinctive One": "The Beast",
  "The Self-Undoing Mind": "The Saboteur",
  "The Judging Mind": "The Critic",
  "The Bitter Mind": "The Cynic",
  "The Steering-Others Mind": "The Manipulator",
  "The Hiding Mind": "The Liar",
  "The Avoiding Mind": "The Coward",
  "The Dominating Mind": "The Tyrant",
};

function lexiconKey(name: string) {
  return NAME_ALIASES[name] ?? name;
}

/** Plain-language reason why this neighbour was suggested. */
export function neighborReason(
  primary: ResidentLite,
  other: ResidentLite,
  angle: "closest" | "balance" | "related"
) {
  if (angle === "closest") {
    return `Usually stands right beside ${primary.name} - gift: ${other.function}.`;
  }
  if (angle === "balance") {
    return `Sits on the other side of ${primary.name}, steadying or challenging it - gift: ${other.function}.`;
  }
  return `Often appears together with ${primary.name} - gift: ${other.function}.`;
}

const DISTRICT_DEFAULT_ACTION: Record<District, SuggestedAction> = {
  Cognitive: "redirect",
  Professional: "increase",
  Money: "decrease",
  Relational: "increase",
  Emotional: "redirect",
  Creative: "increase",
  Body: "redirect",
  Spiritual: "increase",
  Primal: "decrease",
  Destructive: "decrease",
  Higher: "increase",
};

const RESIDENT_ACTION_OVERRIDES: Record<string, SuggestedAction> = {
  "The Thinker": "redirect",
  "The Questioner": "redirect",
  "The Topper": "decrease",
  "The Employee": "decrease",
  "The Gambler": "sleep",
  "The Addict": "sleep",
  "The Anxious One": "redirect",
  "The Depressive": "increase",
  "The Guilty One": "decrease",
  "The Ashamed One": "decrease",
  "The Envious One": "redirect",
  "The Sad One": "increase",
  "The Angry One": "redirect",
  "The Lonely One": "increase",
  "The Prey": "redirect",
  "The Beast": "redirect",
  "The Saboteur": "sleep",
  "The Critic": "decrease",
  "The Cynic": "sleep",
  "The Manipulator": "decrease",
  "The Liar": "sleep",
  "The Coward": "decrease",
  "The Tyrant": "decrease",
  "The Seeker": "redirect",
  "The Social Man": "decrease",
  "The Monk": "redirect",
  "The Witness": "increase",
  "The Survivor": "increase",
  "The Protector": "increase",
  "The Child": "increase",
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function normalize(text: string) {
  return ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cueScore(text: string, cue: string) {
  const phrase = cue.toLowerCase();
  if (phrase.includes(" ")) {
    let count = 0;
    let index = text.indexOf(` ${phrase} `);
    while (index !== -1) {
      count += 1;
      index = text.indexOf(` ${phrase} `, index + phrase.length);
    }
    if (count === 0 && text.includes(phrase)) count = 1;
    return Math.min(count, 2) * 2.5;
  }
  const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "g");
  const matches = text.match(regex)?.length ?? 0;
  return Math.min(matches, 3) * 1.2;
}

function scoreResident(text: string, resident: ResidentLite) {
  const cues = LEXICON[lexiconKey(resident.name)] ?? [];
  let score = 0;
  // Specificity (total length of matched cues) is used as a tie-breaker so
  // that "daughter" beats a generic "worry", for example.
  let specificity = 0;
  for (const cue of cues) {
    const cueScoreValue = cueScore(text, cue);
    if (cueScoreValue > 0) {
      score += cueScoreValue;
      specificity += cue.length;
    }
  }
  if (text.includes(resident.name.toLowerCase())) {
    score += 3;
    specificity += resident.name.length;
  }
  return { score, specificity };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function pickAction(resident: ResidentLite): SuggestedAction {
  return (
    RESIDENT_ACTION_OVERRIDES[lexiconKey(resident.name)] ??
    DISTRICT_DEFAULT_ACTION[resident.district as District] ??
    "redirect"
  );
}

export function buildReasoning(resident: ResidentLite, action: SuggestedAction) {
  const meta =
    DISTRICT_META[resident.district as District] ?? DISTRICT_META.Cognitive;
  const actionMeta = ACTION_META[action];
  return `This thought carries the voice of ${resident.name}. ${meta.tagline} ${actionMeta.hint}`;
}

function fallback(residents: ResidentLite[]): Prediction {
  const witness =
    residents.find((r) => r.name === "The Witness") ?? residents[0];
  const neighbors = residents
    .filter((r) => r.district === witness.district && r.id !== witness.id)
    .slice(0, 2)
    .map((r) => ({
      name: r.name,
      confidence: 0.4,
      reason: neighborReason(witness, r, "closest"),
    }));
  return {
    primary_resident: witness?.name ?? "The Witness",
    confidence: 0.4,
    secondary_residents: [],
    neighbors,
    suggested_action: "redirect",
    reasoning:
      "No single resident stands out in this thought yet. Step back and observe it for a moment - the Witness can hold it while you decide.",
  };
}

export function predictLocally(
  thought: string,
  residents: ResidentLite[]
): Prediction {
  if (!residents.length) {
    return {
      primary_resident: "The Witness",
      confidence: 0.4,
      secondary_residents: [],
      neighbors: [],
      suggested_action: "redirect",
      reasoning: "The village is still being built.",
    };
  }

  const text = normalize(thought);
  const ranked = residents
    .map((resident) => ({ resident, ...scoreResident(text, resident) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.specificity - a.specificity ||
        a.resident.name.localeCompare(b.resident.name)
    );

  if (!ranked.length) return fallback(residents);

  const top = ranked[0];
  const secondScore = ranked[1]?.score ?? 0;
  const confidence = round(
    clamp(0.45 + 0.5 * ((top.score - secondScore) / (top.score + 1)), 0.4, 0.92)
  );

  const secondary = ranked
    .slice(1, 4)
    .map((entry) => ({
      name: entry.resident.name,
      confidence: round(
        clamp((entry.score / top.score) * 0.6, 0.15, 0.7)
      ),
    }));

  // Neighbours: co-active residents from the same district, best scored first.
  const neighborEntries = ranked
    .filter(
      (entry) =>
        entry.resident.district === top.resident.district &&
        entry.resident.id !== top.resident.id
    )
    .map((entry) => ({
      resident: entry.resident,
      confidence: round(clamp((entry.score / top.score) * 0.6, 0.15, 0.7)),
    }));
  const fillerEntries = residents
    .filter(
      (resident) =>
        resident.district === top.resident.district &&
        resident.id !== top.resident.id &&
        !neighborEntries.some((entry) => entry.resident.id === resident.id)
    )
    .map((resident) => ({ resident, confidence: 0.3 }));
  const neighbors = [...neighborEntries, ...fillerEntries]
    .slice(0, 2)
    .map((entry) => ({
      name: entry.resident.name,
      confidence: entry.confidence,
      reason: neighborReason(top.resident, entry.resident, "closest"),
    }));

  const action = pickAction(top.resident);

  return {
    primary_resident: top.resident.name,
    confidence,
    secondary_residents: secondary,
    neighbors,
    suggested_action: action,
    reasoning: buildReasoning(top.resident, action),
  };
}
