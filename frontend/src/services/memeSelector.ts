import { Contract, Side } from "../types/enums";

export interface MemeConfig {
  caption: string;
  id: string;
  image: string;
}

export interface GameContext {
  attackWins: boolean;
  contract: Contract;
  petitAuBout: Side;
}

const SUCCESS_KID: MemeConfig = {
  caption: "Petit au bout, comme un chef !",
  id: "success-kid",
  image: "/memes/success-kid.webp",
};

const VINCE_MEMES: Record<string, MemeConfig> = {
  [Contract.GardeContre]: { caption: "GARDE CONTRE RÉUSSIE !!!", id: "vince-4", image: "/memes/vince-4.webp" },
  [Contract.GardeSans]: { caption: "Garde sans, pas de problème !", id: "vince-3", image: "/memes/vince-3.webp" },
  [Contract.Garde]: { caption: "La garde est assurée !", id: "vince-2", image: "/memes/vince-2.webp" },
  [Contract.Petite]: { caption: "Petite tranquille !", id: "vince-1", image: "/memes/vince-1.webp" },
};

const BASIC_POOL: MemeConfig[] = [
  { caption: "Deal with it 😎", id: "deal-with-it", image: "/memes/deal-with-it.webp" },
  { caption: "We are the champions !", id: "champions", image: "/memes/champions.webp" },
  { caption: "À la victoire !", id: "dicaprio-toast", image: "/memes/dicaprio-toast.webp" },
  { caption: "It's over 9000 !", id: "over-9000", image: "/memes/over-9000.webp" },
];

const MEME_CHANCE = 0.4;
const VINCE_CHANCE = 0.4;

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
