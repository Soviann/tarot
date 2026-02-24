import { useEffect } from "react";

export function useCheatCode(triggerNames: string[], onActivate: () => void): void {
  useEffect(() => {
    const normalized = triggerNames.map((n) => n.toLowerCase().trim());

    const handleInput = (e: Event) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.hasAttribute("data-cheat-target")) return;

      const value = target.value.toLowerCase().trim();
      if (normalized.includes(value)) {
        onActivate();
      }
    };

    document.addEventListener("input", handleInput);
    return () => document.removeEventListener("input", handleInput);
  }, [triggerNames, onActivate]);
}
