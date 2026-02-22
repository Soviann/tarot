import { useCallback } from "react";
import { useTheme } from "next-themes";
import type { GameCompletedEvent } from "../services/gameEvents";
import { getThemeConfig } from "../services/themeRegistry";
import { useGameEventListener } from "./useGameEventListener";

function play(src: string): void {
  new Audio(src).play().catch(() => {});
}

export function useThemeSounds(): { playActivation: (themeName: string) => void } {
  const { resolvedTheme } = useTheme();

  const handleGameCompleted = useCallback(
    (event: GameCompletedEvent) => {
      const themeConfig = getThemeConfig(resolvedTheme);
      if (!themeConfig) return;

      const sound = themeConfig.selectSound(event);
      if (!sound) return;

      const klaxonSound = themeConfig.sounds["klaxon"];
      if (klaxonSound && sound === klaxonSound) {
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

  const playActivation = useCallback((themeName: string) => {
    const config = getThemeConfig(themeName);
    if (config?.activationSound) {
      play(config.activationSound);
    }
  }, []);

  return { playActivation };
}
