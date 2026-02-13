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
  oudlers: number;
  petitAuBout: Side;
}

// --- Victory memes ---

const SUCCESS_KID: MemeConfig = {
  caption: "Petit au bout, comme un chef !",
  id: "success-kid",
  image: "/memes/success-kid.webp",
};

const VINCE_MEMES: Record<string, MemeConfig> = {
  [Contract.Garde]: { caption: "La garde est assurée !", id: "vince-2", image: "/memes/vince-2.webp" },
  [Contract.GardeContre]: { caption: "GARDE CONTRE RÉUSSIE !!!", id: "vince-4", image: "/memes/vince-4.webp" },
  [Contract.GardeSans]: { caption: "Garde sans, pas de problème !", id: "vince-3", image: "/memes/vince-3.webp" },
  [Contract.Petite]: { caption: "Petite tranquille !", id: "vince-1", image: "/memes/vince-1.webp" },
};

const BASIC_POOL: MemeConfig[] = [
  { caption: "Deal with it 😎", id: "deal-with-it", image: "/memes/deal-with-it.webp" },
  { caption: "We are the champions !", id: "champions", image: "/memes/champions.webp" },
  { caption: "À la victoire !", id: "dicaprio-toast", image: "/memes/dicaprio-toast.webp" },
  { caption: "It's over 9000 !", id: "over-9000", image: "/memes/over-9000.webp" },
];

// --- Defeat memes ---

const PIKACHU_SURPRISED: MemeConfig = {
  caption: "Mais... comment ?!",
  id: "pikachu-surprised",
  image: "/memes/pikachu-surprised.webp",
};

const VINCE_REVERSE_MEMES: Record<string, MemeConfig> = {
  [Contract.Garde]: { caption: "La garde est chutée...", id: "vince-reverse-2", image: "/memes/vince-reverse-2.webp" },
  [Contract.GardeSans]: { caption: "Garde sans... perdue.", id: "vince-reverse-3", image: "/memes/vince-reverse-3.webp" },
  [Contract.Petite]: { caption: "Même la petite...", id: "vince-reverse-1", image: "/memes/vince-reverse-1.webp" },
};

const DEFEAT_POOL: MemeConfig[] = [
  { caption: "Ah shit, here we go again", id: "ah-shit", image: "/memes/ah-shit.webp" },
  { caption: "Crying Jordan", id: "crying-jordan", image: "/memes/crying-jordan.webp" },
  { caption: "First time ?", id: "first-time", image: "/memes/first-time.webp" },
  { caption: "Why are we still here? Just to suffer?", id: "just-to-suffer", image: "/memes/just-to-suffer.webp" },
  { caption: "Sad Pablo", id: "sad-pablo", image: "/memes/sad-pablo.webp" },
];

// --- Shared constants ---

const MEME_CHANCE = 0.4;
const VINCE_CHANCE = 0.4;

// --- Selectors ---

export function selectVictoryMeme(ctx: GameContext): MemeConfig | null {
  if (!ctx.attackWins) return null;

  // Priority 1: Petit au bout by attack — always Success Kid (rare event, always celebrate)
  if (ctx.petitAuBout === Side.Attack) {
    return SUCCESS_KID;
  }

  // 40% overall chance of showing a meme
  if (Math.random() >= MEME_CHANCE) return null;

  // Among shown memes: 40% chance for Vince McMahon at contract-specific level
  if (Math.random() < VINCE_CHANCE) {
    return VINCE_MEMES[ctx.contract];
  }

  // Default: random from basic pool
  return BASIC_POOL[Math.floor(Math.random() * BASIC_POOL.length)];
}

export function selectDefeatMeme(ctx: GameContext): MemeConfig | null {
  if (ctx.attackWins) return null;

  // Priority 1: Pikachu surprised — guaranteed on improbable defeats
  // (3 bouts + loss, chelem raté, garde contre perdue)
  if (ctx.oudlers >= 3 || ctx.chelem === Chelem.AnnouncedLost || ctx.contract === Contract.GardeContre) {
    return PIKACHU_SURPRISED;
  }

  // 40% overall chance of showing a meme
  if (Math.random() >= MEME_CHANCE) return null;

  // Among shown memes: 40% chance for reverse Vince McMahon (contract-specific disappointment)
  if (Math.random() < VINCE_CHANCE) {
    return VINCE_REVERSE_MEMES[ctx.contract];
  }

  // Default: random from defeat pool
  return DEFEAT_POOL[Math.floor(Math.random() * DEFEAT_POOL.length)];
}
