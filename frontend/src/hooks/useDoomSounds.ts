import { useCallback } from "react";
import { useTheme } from "next-themes";
import type { GameCompletedEvent } from "../services/gameEvents";
import { useGameEventListener } from "./useGameEventListener";

const SOUNDS = {
  chainsawUp: "/sounds/doom/chainsaw-up.wav",
  doorOpen: "/sounds/doom/door-open.wav",
  klaxon: "/sounds/doom/klaxon.wav",
  pistol: "/sounds/doom/pistol.wav",
  playerPain: "/sounds/doom/player-pain.wav",
  playerUmf: "/sounds/doom/player-umf.wav",
  shotgun: "/sounds/doom/shotgun.wav",
} as const;

function play(src: string): void {
  new Audio(src).play().catch(() => {});
}

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

function selectSound(event: GameCompletedEvent): string | null {
  const { context: ctx, cumulativeScores, previousCumulativeScores } = event;

  // Priority 1: threshold crossing → klaxon
  if (hasCrossedThreshold(cumulativeScores, previousCumulativeScores)) {
    return SOUNDS.klaxon;
  }

  // Priority 2: self-call victory → chainsaw
  if (ctx.isSelfCall && ctx.attackWins) return SOUNDS.chainsawUp;

  // Priority 3: big victory → shotgun
  if (ctx.attackWins && ctx.takerScore >= 200) return SOUNDS.shotgun;

  // Priority 4: normal victory → pistol
  if (ctx.attackWins) return SOUNDS.pistol;

  // Priority 5: big defeat → pain
  if (!ctx.attackWins && ctx.takerScore <= -200) return SOUNDS.playerPain;

  // Priority 6: normal defeat → umf
  return SOUNDS.playerUmf;
}

export function useDoomSounds(): { playActivation: () => void } {
  const { resolvedTheme } = useTheme();

  const handleGameCompleted = useCallback(
    (event: GameCompletedEvent) => {
      if (resolvedTheme !== "doom") return;

      const sound = selectSound(event);
      if (!sound) return;

      if (sound === SOUNDS.klaxon) {
        play(sound);
        setTimeout(() => play(sound), 300);
        setTimeout(() => play(sound), 600);
      } else {
        play(sound);
      }
    },
    [resolvedTheme],
  );

  useGameEventListener("game:completed", handleGameCompleted);

  const playActivation = useCallback(() => {
    play(SOUNDS.doorOpen);
  }, []);

  return { playActivation };
}
