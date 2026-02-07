import type { Chelem, Contract, Poignee, Side } from "../types/enums";

export interface ScoreCalculatorInput {
  chelem: Chelem;
  contract: Contract;
  oudlers: number;
  partnerId: number | null;
  petitAuBout: Side;
  poignee: Poignee;
  points: number;
}

export interface ScoreResult {
  attackWins: boolean;
  baseScore: number;
  chelemBonus: number;
  defenderScore: number;
  partnerScore: number;
  petitAuBoutBonus: number;
  poigneeBonus: number;
  takerScore: number;
  totalPerPlayer: number;
}

export const REQUIRED_POINTS: Record<number, number> = { 0: 56, 1: 51, 2: 41, 3: 36 };

const CONTRACT_MULTIPLIER: Record<Contract, number> = {
  garde: 2,
  garde_contre: 6,
  garde_sans: 4,
  petite: 1,
};

const POIGNEE_BONUS: Record<Poignee, number> = {
  double: 30,
  none: 0,
  simple: 20,
  triple: 40,
};

const CHELEM_BONUS: Record<Chelem, number> = {
  announced_lost: -200,
  announced_won: 400,
  none: 0,
  not_announced_won: 200,
};

export function calculateScore(input: ScoreCalculatorInput): ScoreResult {
  const { chelem, contract, oudlers, partnerId, petitAuBout, poignee, points } = input;
  const multiplier = CONTRACT_MULTIPLIER[contract];
  const requiredPoints = REQUIRED_POINTS[oudlers];
  const attackWins = points >= requiredPoints;
  const selfCall = partnerId === null;

  // Score de base : (|points - requis| + 25) × multiplicateur
  let baseScore = (Math.abs(points - requiredPoints) + 25) * multiplier;
  if (!attackWins) {
    baseScore = -baseScore;
  }

  // Bonus poignée : toujours au camp gagnant
  let poigneeBonus = POIGNEE_BONUS[poignee];
  if (!attackWins) {
    poigneeBonus = -poigneeBonus;
  }

  // Bonus petit au bout : 10 × multiplicateur
  // Positif uniquement si l'attaque l'a joué ET gagne ; négatif dans les 3 autres cas
  let petitAuBoutBonus = 0;
  if (petitAuBout !== "none") {
    const bonus = 10 * multiplier;
    petitAuBoutBonus = petitAuBout === "attack" && attackWins ? bonus : -bonus;
  }

  // Bonus chelem
  const chelemBonus = CHELEM_BONUS[chelem];

  const totalPerPlayer = baseScore + poigneeBonus + petitAuBoutBonus + chelemBonus;

  // Distribution
  const takerScore = totalPerPlayer * (selfCall ? 4 : 2);
  const partnerScore = selfCall ? 0 : totalPerPlayer;
  const defenderScore = -totalPerPlayer;

  return {
    attackWins,
    baseScore,
    chelemBonus,
    defenderScore,
    partnerScore,
    petitAuBoutBonus,
    poigneeBonus,
    takerScore,
    totalPerPlayer,
  };
}
