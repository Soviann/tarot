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
  isSelfCall: boolean;
  oudlers: number;
  petitAuBout: Side;
  points: number;
  takerScore: number;
}

export interface WeightedMeme {
  meme: MemeConfig;
  weight: number;
}

// --- Meme definitions ---

// Victory
const BORAT: MemeConfig = { caption: "", id: "borat", image: "/memes/borat.webp" };
const CHAMPIONS: MemeConfig = { caption: "", id: "champions", image: "/memes/champions.webp" };
const DICAPRIO_TOAST: MemeConfig = { caption: "", id: "dicaprio-toast", image: "/memes/dicaprio-toast.webp" };
const OBAMA_MEDAL: MemeConfig = { caption: "", id: "obama-medal", image: "/memes/obama-medal.webp" };
const OVER_9000: MemeConfig = { caption: "", id: "over-9000", image: "/memes/over-9000.webp" };
const PACHA: MemeConfig = { caption: "", id: "pacha", image: "/memes/pacha.webp" };
const SUCCESS_KID: MemeConfig = { caption: "", id: "success-kid", image: "/memes/success-kid.webp" };

// Defeat
const AH_SHIT: MemeConfig = { caption: "", id: "ah-shit", image: "/memes/ah-shit.webp" };
const CHOSEN_ONE: MemeConfig = { caption: "", id: "chosen-one", image: "/memes/chosen-one.webp" };
const CRYING_JORDAN: MemeConfig = { caption: "", id: "crying-jordan", image: "/memes/crying-jordan.webp" };
const JUST_TO_SUFFER: MemeConfig = { caption: "", id: "just-to-suffer", image: "/memes/just-to-suffer.webp" };
const PICARD_FACEPALM: MemeConfig = { caption: "", id: "picard-facepalm", image: "/memes/picard-facepalm.webp" };
const PIKACHU_SURPRISED: MemeConfig = { caption: "", id: "pikachu-surprised", image: "/memes/pikachu-surprised.webp" };
const SAD_PABLO: MemeConfig = { caption: "", id: "sad-pablo", image: "/memes/sad-pablo.webp" };
const THIS_IS_FINE: MemeConfig = { caption: "", id: "this-is-fine", image: "/memes/this-is-fine.webp" };

// Special
const INFINITY_BEYOND: MemeConfig = { caption: "To infinity… and beyond!", id: "infinity-beyond", image: "/memes/infinity-beyond.jpg" };
const MIND_BLOWN: MemeConfig = { caption: "42 — La réponse à la grande question", id: "mind-blown", image: "/memes/mind-blown.gif" };

// --- Constants ---

const MEME_CHANCE = 0.4;
const BASE_WEIGHT = 1;

// --- Pool builder ---

export function buildPool(ctx: GameContext): WeightedMeme[] {
  const pool: WeightedMeme[] = [];

  // Special memes (any result)
  if (Math.abs(ctx.takerScore) >= 200) {
    pool.push({ meme: INFINITY_BEYOND, weight: 30 });
  }
  if (ctx.points === 42) {
    pool.push({ meme: MIND_BLOWN, weight: 40 });
  }

  if (ctx.attackWins) {
    // Conditional victory memes
    if (ctx.petitAuBout === Side.Attack) {
      pool.push({ meme: SUCCESS_KID, weight: 10 });
    }
    if (ctx.isSelfCall) {
      pool.push({ meme: OBAMA_MEDAL, weight: 40 });
    }
    // Base victory pool
    pool.push({ meme: BORAT, weight: BASE_WEIGHT });
    pool.push({ meme: CHAMPIONS, weight: BASE_WEIGHT });
    pool.push({ meme: DICAPRIO_TOAST, weight: BASE_WEIGHT });
    pool.push({ meme: OVER_9000, weight: BASE_WEIGHT });
    pool.push({ meme: PACHA, weight: BASE_WEIGHT });
  } else {
    // Conditional defeat memes
    if (ctx.oudlers >= 3 || ctx.chelem === Chelem.AnnouncedLost || ctx.contract === Contract.GardeContre) {
      pool.push({ meme: CHOSEN_ONE, weight: 30 });
      pool.push({ meme: PICARD_FACEPALM, weight: 20 });
      pool.push({ meme: PIKACHU_SURPRISED, weight: 10 });
    }
    if (ctx.contract === Contract.GardeSans) {
      pool.push({ meme: CRYING_JORDAN, weight: 20 });
    }
    // Base defeat pool
    pool.push({ meme: AH_SHIT, weight: BASE_WEIGHT });
    pool.push({ meme: JUST_TO_SUFFER, weight: BASE_WEIGHT });
    pool.push({ meme: SAD_PABLO, weight: BASE_WEIGHT });
    pool.push({ meme: THIS_IS_FINE, weight: BASE_WEIGHT });
  }

  return pool;
}

// --- Weighted random selection ---

function weightedRandom(pool: WeightedMeme[]): MemeConfig | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of pool) {
    roll -= item.weight;
    if (roll < 0) return item.meme;
  }

  return pool[pool.length - 1].meme;
}

// --- Main selector ---

export function selectMeme(ctx: GameContext): MemeConfig | null {
  if (Math.random() >= MEME_CHANCE) return null;
  return weightedRandom(buildPool(ctx));
}
