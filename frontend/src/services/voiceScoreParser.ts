import { Chelem, Contract, Poignee } from "../types/enums";
import type { Chelem as ChelemType, Contract as ContractType, Poignee as PoigneeType } from "../types/enums";

export interface VoiceScoreResult {
  chelem?: ChelemType;
  contract?: ContractType;
  oudlers?: number;
  petitAuBout?: boolean;
  playerName?: string;
  poignee?: PoigneeType;
  points?: number;
}

const FILLER_WORDS = /\b(euh|heu|donc|alors|ben|bah|hein|voila|voilà)\b/g;

/**
 * Lowercase, strip accents, replace apostrophes with spaces, remove punctuation
 * and filler words, collapse whitespace.
 */
export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019\u2018]/g, " ")
    .replace(/[.,;:!?"()]/g, "")
    .replace(FILLER_WORDS, "")
    .replace(/\s+/g, " ")
    .trim();
}

const UNITS: Record<string, number> = {
  cinq: 5,
  deux: 2,
  dix: 10,
  douze: 12,
  huit: 8,
  neuf: 9,
  onze: 11,
  quatorze: 14,
  quatre: 4,
  quinze: 15,
  seize: 16,
  sept: 7,
  six: 6,
  treize: 13,
  trois: 3,
  un: 1,
  zero: 0,
};

/**
 * Convert a French number word (0–91) to its numeric value. Returns null if not parseable.
 */
export function frenchWordToNumber(text: string): number | null {
  // Normalize: replace spaces with hyphens, strip "et"
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-et-/g, "-")
    .replace(/^et-/, "")
    .replace(/-et$/, "");

  // Direct unit lookup
  if (normalized in UNITS) return UNITS[normalized];

  // quatre-vingts / quatre-vingt
  if (normalized === "quatre-vingts" || normalized === "quatre-vingt") return 80;

  // quatre-vingt-dix
  if (normalized === "quatre-vingt-dix") return 90;

  // quatre-vingt-X (81–89, 91)
  const qvMatch = normalized.match(/^quatre-vingt-(.+)$/);
  if (qvMatch) {
    const rest = UNITS[qvMatch[1]];
    if (rest !== undefined && rest >= 1 && rest <= 16) return 80 + rest;
    return null;
  }

  // soixante-dix / soixante-dix-X
  if (normalized === "soixante-dix") return 70;
  const sdMatch = normalized.match(/^soixante-dix-(.+)$/);
  if (sdMatch) {
    const rest = UNITS[sdMatch[1]];
    if (rest !== undefined && rest >= 1 && rest <= 9) return 70 + rest;
    return null;
  }

  // soixante-X (60–69, 71 via soixante-onze)
  const sMatch = normalized.match(/^soixante-(.+)$/);
  if (sMatch) {
    const rest = UNITS[sMatch[1]];
    if (rest !== undefined) {
      if (rest >= 1 && rest <= 16) return 60 + rest;
    }
    return null;
  }
  if (normalized === "soixante") return 60;

  // Tens: vingt, trente, quarante, cinquante
  const tens: Record<string, number> = {
    cinquante: 50,
    quarante: 40,
    trente: 30,
    vingt: 20,
  };

  for (const [word, value] of Object.entries(tens)) {
    if (normalized === word) return value;
    const tMatch = normalized.match(new RegExp(`^${word}-(.+)$`));
    if (tMatch) {
      const rest = UNITS[tMatch[1]];
      if (rest !== undefined && rest >= 1 && rest <= 9) return value + rest;
      return null;
    }
  }

  // dix-sept, dix-huit, dix-neuf
  const dixMatch = normalized.match(/^dix-(.+)$/);
  if (dixMatch) {
    const rest = UNITS[dixMatch[1]];
    if (rest !== undefined && rest >= 7 && rest <= 9) return 10 + rest;
    return null;
  }

  return null;
}

/**
 * Detect a Tarot contract from normalized text.
 */
export function extractContrat(text: string): ContractType | null {
  // Order matters: check compound forms first
  if (/\bgarde\s+sans\b/.test(text)) return Contract.GardeSans;
  if (/\bgarde\s+contre\b/.test(text)) return Contract.GardeContre;
  if (/\bgarde\b/.test(text)) return Contract.Garde;
  if (/\bpetite\b/.test(text)) return Contract.Petite;
  return null;
}

/**
 * Extract points (0–91) from text. Tries digit form first, then French words.
 */
export function extractPoints(text: string): number | null {
  // Try digit form: look for number followed by "points/pts", not preceded by minus
  // Only match digits followed by "points" to avoid capturing oudler digits like "3b"
  const digitWithPointsMatch = text.match(/(?<![−-])(\b\d+)\s+(?:points?|pts)\b/);
  if (digitWithPointsMatch) {
    const n = parseInt(digitWithPointsMatch[1], 10);
    if (n >= 0 && n <= 91) return n;
  }

  // Try French word form: find "points" keyword and look for words before it
  const pointsIdx = text.search(/\bpoints?\b/);
  if (pointsIdx > 0) {
    const before = text.substring(0, pointsIdx).trim();
    const words = before.split(/\s+/);
    for (let i = Math.max(0, words.length - 4); i < words.length; i++) {
      const candidate = words.slice(i).join(" ");
      const n = frenchWordToNumber(candidate);
      if (n !== null && n >= 0 && n <= 91) return n;
    }
  }

  // Try standalone digit (no "points" keyword), skip oudler patterns (Xb, X bout)
  const standaloneDigit = text.match(/(?<![−-\w])(\d{1,2})(?!\s*b(?:outs?)?\b)(?:\s|$)/);
  if (standaloneDigit) {
    const n = parseInt(standaloneDigit[1], 10);
    if (n >= 0 && n <= 91) return n;
  }

  // Try standalone French number words (no "points" keyword)
  if (!digitWithPointsMatch && !standaloneDigit) {
    const words = text.split(/\s+/);
    for (let len = 4; len >= 1; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const candidate = words.slice(i, i + len).join(" ");
        const n = frenchWordToNumber(candidate);
        if (n !== null && n >= 0 && n <= 91) return n;
      }
    }
  }

  return null;
}

/**
 * Compute Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Partner keywords: "appelé", "avec", "partenaire" + common misrecognitions
const PARTNER_KEYWORDS = /\b(?:appele[r]?|avec|partenaire|la\s+plaie|la\s+plait)\s+(\S+)/;

/**
 * Find a player reference in the text. Returns the matched player name from the list,
 * "__self__" for self-call, or null if not found/ambiguous.
 */
export function extractPlayerReference(
  text: string,
  playerNames: string[],
): string | null {
  // Check for self-call
  if (/\bseul\b/.test(text)) return "__self__";

  const match = text.match(PARTNER_KEYWORDS);
  if (!match) return null;

  const spoken = match[1].toLowerCase();

  // Exact match (case-insensitive)
  const exact = playerNames.find((name) => name.toLowerCase() === spoken);
  if (exact) return exact;

  // Starts-with match
  const startsWith = playerNames.filter((name) =>
    name.toLowerCase().startsWith(spoken),
  );
  if (startsWith.length === 1) return startsWith[0];

  // Fuzzy match: Levenshtein distance ≤ 2 (≤ 1 for short names)
  const maxDist = spoken.length >= 4 ? 2 : 1;
  const fuzzy = playerNames.filter(
    (name) => levenshtein(name.toLowerCase(), spoken) <= maxDist,
  );
  if (fuzzy.length === 1) return fuzzy[0];

  return null;
}

const OUDLER_WORDS: Record<string, number> = {
  deux: 2,
  trois: 3,
  un: 1,
  zero: 0,
};

/**
 * Extract oudler count (1–3) from text. Handles French words, digits,
 * and common misrecognitions ("debout" → 2, "3b" → 3).
 */
export function extractOudlers(text: string): number | null {
  // "aucun bout", "sans bout", "pas de bout" = 0 oudlers
  if (/\b(?:aucun|sans)\s+bouts?\b/.test(text) || /\bpas\s+de\s+bouts?\b/.test(text)) return 0;

  // "debout" = common misrecognition of "deux bouts"
  if (/\bdebout\b/.test(text)) return 2;

  // French word + "bout(s)": "zero bout", "un bout", "deux bouts", "trois bouts"
  const wordMatch = text.match(/\b(zero|un|deux|trois)\s+bouts?\b/);
  if (wordMatch) {
    const n = OUDLER_WORDS[wordMatch[1]];
    if (n !== undefined && n >= 0 && n <= 3) return n;
  }

  // Digit + "bout(s)": "0 bout", "2 bouts", "3 bouts"
  const digitMatch = text.match(/\b([0-3])\s+bouts?\b/);
  if (digitMatch) return parseInt(digitMatch[1], 10);

  // Misrecognition "Xb": "3b", "2b"
  const compactMatch = text.match(/\b([1-3])b\b/);
  if (compactMatch) return parseInt(compactMatch[1], 10);

  return null;
}

interface BonusResult {
  chelem: ChelemType;
  petitAuBout: boolean;
  poignee: PoigneeType;
}

/**
 * Extract bonus declarations from normalized text.
 */
export function extractBonuses(text: string): BonusResult {
  const petitAuBout = /\bpetit au bout\b/.test(text);

  let poignee: PoigneeType = Poignee.None;
  if (/\btriple\s+poignee\b/.test(text) || /\bpoignee\s+triple\b/.test(text)) {
    poignee = Poignee.Triple;
  } else if (/\bdouble\s+poignee\b/.test(text) || /\bpoignee\s+double\b/.test(text)) {
    poignee = Poignee.Double;
  } else if (/\bpoignee\s+simple\b/.test(text) || /\bsimple\s+poignee\b/.test(text)) {
    poignee = Poignee.Simple;
  } else if (/\bpoignee\b/.test(text)) {
    poignee = Poignee.Simple;
  }

  let chelem: ChelemType = Chelem.None;
  if (/\bchelem\s+annonce\s+perdu\b/.test(text)) {
    chelem = Chelem.AnnouncedLost;
  } else if (/\bchelem\s+non\s+annonce\b/.test(text)) {
    chelem = Chelem.NotAnnouncedWon;
  } else if (/\bchelem\s+annonce\b/.test(text)) {
    chelem = Chelem.AnnouncedWon;
  } else if (/\bchelem\b/.test(text)) {
    chelem = Chelem.NotAnnouncedWon;
  }

  return { chelem, petitAuBout, poignee };
}

/**
 * Main parser: takes a raw transcript and player names, returns a partial score form result.
 * Never throws. Returns empty object for unparseable input.
 */
export function parseVoiceScore(
  transcript: string,
  playerNames: string[],
): VoiceScoreResult {
  try {
    const normalized = normalizeTranscript(transcript);
    if (!normalized) return {};

    const result: VoiceScoreResult = {};

    const contract = extractContrat(normalized);
    if (contract) result.contract = contract;

    const points = extractPoints(normalized);
    if (points !== null) result.points = points;

    const playerRef = extractPlayerReference(normalized, playerNames);
    if (playerRef) result.playerName = playerRef;

    const oudlers = extractOudlers(normalized);
    if (oudlers !== null) result.oudlers = oudlers;

    const bonuses = extractBonuses(normalized);
    if (bonuses.petitAuBout) result.petitAuBout = true;
    if (bonuses.poignee !== Poignee.None) result.poignee = bonuses.poignee;
    if (bonuses.chelem !== Chelem.None) result.chelem = bonuses.chelem;

    return result;
  } catch {
    return {};
  }
}
