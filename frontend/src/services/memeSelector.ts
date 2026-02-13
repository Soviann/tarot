import { Chelem, Contract, Side } from "../types/enums";

export interface MemeConfig {
  caption: string;
  id: string;
  image: string;
}

export interface GameContext {
  attackWins: boolean;
  chelem: Chelem;
  contract: Contract;
  isFirstTakerDefeat: boolean;
  isSelfCall: boolean;
  oudlers: number;
  petitAuBout: Side;
}

// --- Victory memes ---

const OBAMA_MEDAL: MemeConfig = {
  caption: "",
  id: "obama-medal",
  image: "/memes/obama-medal.webp",
};

const SUCCESS_KID: MemeConfig = {
  caption: "",
  id: "success-kid",
  image: "/memes/success-kid.webp",
};

const BASIC_POOL: MemeConfig[] = [
  { caption: "", id: "borat", image: "/memes/borat.webp" },
  { caption: "", id: "champions", image: "/memes/champions.webp" },
  { caption: "", id: "dicaprio-toast", image: "/memes/dicaprio-toast.webp" },
  { caption: "", id: "over-9000", image: "/memes/over-9000.webp" },
  { caption: "", id: "pacha", image: "/memes/pacha.webp" },
];

// --- Defeat memes ---

const IMPROBABLE_DEFEAT_POOL: MemeConfig[] = [
  { caption: "", id: "chosen-one", image: "/memes/chosen-one.webp" },
  { caption: "", id: "picard-facepalm", image: "/memes/picard-facepalm.webp" },
  { caption: "", id: "pikachu-surprised", image: "/memes/pikachu-surprised.webp" },
];

const CRYING_JORDAN: MemeConfig = {
  caption: "",
  id: "crying-jordan",
  image: "/memes/crying-jordan.webp",
};

const FIRST_TIME: MemeConfig = {
  caption: "",
  id: "first-time",
  image: "/memes/first-time.webp",
};

const THIS_IS_FINE: MemeConfig = {
  caption: "",
  id: "this-is-fine",
  image: "/memes/this-is-fine.webp",
};

const DEFEAT_POOL: MemeConfig[] = [
  { caption: "", id: "ah-shit", image: "/memes/ah-shit.webp" },
  { caption: "", id: "just-to-suffer", image: "/memes/just-to-suffer.webp" },
  { caption: "", id: "sad-pablo", image: "/memes/sad-pablo.webp" },
];

// --- Shared constants ---

const MEME_CHANCE = 0.4;
const THIS_IS_FINE_CHANCE = 0.4;

// --- Selectors ---

export function selectVictoryMeme(ctx: GameContext): MemeConfig | null {
  if (!ctx.attackWins) return null;

  // Priority 1: Petit au bout by attack — always Success Kid (rare event, always celebrate)
  if (ctx.petitAuBout === Side.Attack) {
    return SUCCESS_KID;
  }

  // Priority 2: Self-call win — always Obama Medal (taker rewards themselves)
  if (ctx.isSelfCall) {
    return OBAMA_MEDAL;
  }

  // 40% overall chance of showing a meme
  if (Math.random() >= MEME_CHANCE) return null;

  // Random from basic pool
  return BASIC_POOL[Math.floor(Math.random() * BASIC_POOL.length)];
}

export function selectDefeatMeme(ctx: GameContext): MemeConfig | null {
  if (ctx.attackWins) return null;

  // Priority 1: improbable defeats — guaranteed meme (random between Pikachu & Picard)
  // (3 bouts + loss, chelem raté, garde contre perdue)
  if (ctx.oudlers >= 3 || ctx.chelem === Chelem.AnnouncedLost || ctx.contract === Contract.GardeContre) {
    return IMPROBABLE_DEFEAT_POOL[Math.floor(Math.random() * IMPROBABLE_DEFEAT_POOL.length)];
  }

  // Priority 2: Crying Jordan — guaranteed on garde sans perdue
  if (ctx.contract === Contract.GardeSans) {
    return CRYING_JORDAN;
  }

  // Priority 3: First Time? — guaranteed on taker's first defeat in the session
  if (ctx.isFirstTakerDefeat) {
    return FIRST_TIME;
  }

  // 40% overall chance of showing a meme
  if (Math.random() >= MEME_CHANCE) return null;

  // Among shown memes: 40% chance for "This is Fine"
  if (Math.random() < THIS_IS_FINE_CHANCE) {
    return THIS_IS_FINE;
  }

  // Default: random from defeat pool
  return DEFEAT_POOL[Math.floor(Math.random() * DEFEAT_POOL.length)];
}
