import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { isChristmasPeriod } from "../services/christmasSeason";

export const SEASONAL_APPLIED_KEY = "seasonal_theme_applied";
export const SEASONAL_DISMISSED_KEY = "seasonal_theme_dismissed";

export function getSeasonYear(now: Date = new Date()): string {
  // If in January, the Christmas season started in previous year (e.g. Jan 2027 is 2026 season)
  return now.getMonth() === 0 ? String(now.getFullYear() - 1) : String(now.getFullYear());
}

export function useSeasonalTheme(now: Date = new Date()): void {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const initialChecked = useRef(false);

  useEffect(() => {
    if (initialChecked.current) return;
    initialChecked.current = true;

    const inSeason = isChristmasPeriod(now);
    const seasonYear = getSeasonYear(now);

    if (inSeason) {
      const appliedYear = localStorage.getItem(SEASONAL_APPLIED_KEY);
      const dismissedYear = localStorage.getItem(SEASONAL_DISMISSED_KEY);

      // If this season has not been dismissed by the user and not yet applied
      if (dismissedYear !== seasonYear && appliedYear !== seasonYear) {
        setTheme("noel");
        localStorage.setItem(SEASONAL_APPLIED_KEY, seasonYear);
      }
    } else {
      // Outside Christmas season, if noel was auto-applied, revert to system
      const appliedYear = localStorage.getItem(SEASONAL_APPLIED_KEY);
      if (appliedYear && (theme === "noel" || resolvedTheme === "noel")) {
        setTheme("system");
        localStorage.removeItem(SEASONAL_APPLIED_KEY);
      }
    }
  }, [now, resolvedTheme, setTheme, theme]);
}
