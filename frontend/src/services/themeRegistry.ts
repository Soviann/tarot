import type { CSSProperties } from "react";
import type { GameCompletedEvent } from "./gameEvents";

interface ThemeAvatarConfig {
  icons: readonly string[];
  initialsPosition: "below" | "hidden" | "inside";
}

export interface SoundEffect {
  repeatCount?: number;
  repeatDelay?: number;
  src: string;
}

export interface ThemeConfig {
  activationSound: string;
  avatars: ThemeAvatarConfig;
  triggerNames: string[];
  dealerIcon: string;
  logo: string;
  name: string;
  normalizeText?: boolean;
  selectSound: (event: GameCompletedEvent) => SoundEffect | null;
  sonnerTheme: "dark" | "light";
  splashImage: string;
  starIcons: string[];
  toastMessage: string;
  toastStyle: CSSProperties;
}

// --- Doom theme sounds ---

const DOOM_SOUNDS = {
  chainsawUp: "/sounds/doom/chainsaw-up.wav",
  doorOpen: "/sounds/doom/door-open.wav",
  klaxon: "/sounds/doom/klaxon.wav",
  pistol: "/sounds/doom/pistol.wav",
  playerPain: "/sounds/doom/player-pain.wav",
  playerUmf: "/sounds/doom/player-umf.wav",
  shotgun: "/sounds/doom/shotgun.wav",
} as const;

function hasCrossedThreshold(
  cumulativeScores: GameCompletedEvent["cumulativeScores"],
  previousCumulativeScores: GameCompletedEvent["previousCumulativeScores"],
): boolean {
  for (const current of cumulativeScores) {
    const prev = previousCumulativeScores.find((p) => p.playerId === current.playerId);
    if (!prev) continue;
    const crossedPositive = Math.abs(current.score) >= 1000 && Math.abs(prev.score) < 1000;
    const crossedNegative =
      (current.score <= -1000 && prev.score > -1000) ||
      (current.score >= 1000 && prev.score < 1000);
    if (crossedPositive || crossedNegative) return true;
  }
  return false;
}

function doomSelectSound(event: GameCompletedEvent): SoundEffect | null {
  const { context: ctx, cumulativeScores, previousCumulativeScores } = event;

  if (hasCrossedThreshold(cumulativeScores, previousCumulativeScores)) {
    return { repeatCount: 3, repeatDelay: 300, src: DOOM_SOUNDS.klaxon };
  }
  if (ctx.isSelfCall && ctx.attackWins) return { src: DOOM_SOUNDS.chainsawUp };
  if (ctx.attackWins && ctx.takerScore >= 200) return { src: DOOM_SOUNDS.shotgun };
  if (ctx.attackWins) return { src: DOOM_SOUNDS.pistol };
  if (!ctx.attackWins && ctx.takerScore <= -200) return { src: DOOM_SOUNDS.playerPain };
  return { src: DOOM_SOUNDS.playerUmf };
}

// --- Registry ---

export const CUSTOM_THEMES: Record<string, ThemeConfig> = {
  doom: {
    activationSound: DOOM_SOUNDS.doorOpen,
    avatars: {
      icons: [
        "/images/doom/doom-bleeding-256x256.png",
        "/images/doom/doom-d-256x256.png",
        "/images/doom/doom-demon-2-256x256.png",
        "/images/doom/doom-demon-256x256.png",
        "/images/doom/doom-demon-green-256x256.png",
        "/images/doom/doom-demon-red-256x256.png",
        "/images/doom/doom-marine-256x256.png",
        "/images/doom/doomguy-face-512.png",
      ],
      initialsPosition: "hidden",
    },
    triggerNames: ["doomguy", "doom guy"],
    dealerIcon: "/images/doom/doomguy-face-512.png",
    logo: "/images/doom/doom-logo-256x256.png",
    name: "doom",
    normalizeText: true,
    selectSound: doomSelectSound,
    sonnerTheme: "dark",
    splashImage: "/images/doom/doom-logo.png",
    starIcons: [
      "/images/doom/doom-demon-32x32.png",
      "/images/doom/doom-demon-2-32x32.png",
      "/images/doom/doom-demon-green-32x32.png",
      "/images/doom/doom-demon-red-32x32.png",
      "/images/doom/doom-marine-32x32.png",
      "/images/doom/doom-marine-2-32x32.png",
      "/images/doom/doom-bleeding-32x32.png",
    ],
    toastMessage: "GOD MODE ACTIVATED",
    toastStyle: {
      background: "#1a0000",
      border: "1px solid #4a0000",
      color: "#ff4444",
      fontWeight: "bold",
    },
  },
};

export function getThemeConfig(theme?: string): ThemeConfig | undefined {
  return theme ? CUSTOM_THEMES[theme] : undefined;
}

export const CUSTOM_THEME_NAMES: string[] = Object.keys(CUSTOM_THEMES);
