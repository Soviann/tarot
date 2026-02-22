import { useCallback } from "react";
import { useTheme } from "next-themes";
import type { GameCompletedEvent } from "../services/gameEvents";
import { getThemeConfig, type SoundEffect } from "../services/themeRegistry";
import { useGameEventListener } from "./useGameEventListener";

function play(src: string): void {
  new Audio(src).play().catch(() => {});
}

function playSoundEffect(effect: SoundEffect): void {
  play(effect.src);
  const count = effect.repeatCount ?? 1;
  const delay = effect.repeatDelay ?? 300;
  for (let i = 1; i < count; i++) {
    setTimeout(() => play(effect.src), delay * i);
  }
}

export function useThemeSounds(): { playActivation: (themeName: string) => void } {
  const { resolvedTheme } = useTheme();

  const handleGameCompleted = useCallback(
    (event: GameCompletedEvent) => {
      const themeConfig = getThemeConfig(resolvedTheme);
      if (!themeConfig) return;

      const effect = themeConfig.selectSound(event);
      if (effect) playSoundEffect(effect);
    },
    [resolvedTheme],
  );

  useGameEventListener("game:completed", handleGameCompleted);

  const playActivation = useCallback((themeName: string) => {
    const config = getThemeConfig(themeName);
    if (config?.activationSound) {
      play(config.activationSound);
    }
  }, []);

  return { playActivation };
}
