import { useCallback } from "react";

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = "hint-last-shown";

export function useHintCooldown() {
  const canShowHint = useCallback((): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    return Date.now() - Number(stored) > COOLDOWN_MS;
  }, []);

  const markHintShown = useCallback((): void => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  return { canShowHint, markHintShown };
}
