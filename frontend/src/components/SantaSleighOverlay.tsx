import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useGameEventListener } from "../hooks/useGameEventListener";
import { getSleighChance, isChristmasPeriod } from "../services/christmasSeason";

const SLEIGH_DURATION_MS = 4200;
const HOHOHO_SOUND_SRC = "/sounds/noel/ho-ho-ho.wav";

export default function SantaSleighOverlay() {
  const { resolvedTheme } = useTheme();
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const triggerSleigh = useCallback(() => {
    if (animating) return;
    setAnimating(true);

    // Play Ho Ho Ho audio
    new Audio(HOHOHO_SOUND_SRC).play().catch(() => {});

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAnimating(false);
    }, SLEIGH_DURATION_MS);
  }, [animating]);

  // Trigger sleigh upon game completion with seasonal / theme probability
  useGameEventListener("game:completed", () => {
    const isSeasonalOrTheme = resolvedTheme === "noel" || isChristmasPeriod();
    if (!isSeasonalOrTheme) return;

    if (Math.random() < getSleighChance()) {
      triggerSleigh();
    }
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!animating) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      data-testid="santa-sleigh-overlay"
    >
      <div className="absolute -left-[650px] top-[18vh] w-[520px] will-change-transform animate-santa-sleigh-traverse">
        <img
          alt=""
          className="h-auto w-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
          data-testid="santa-sleigh-image"
          src="/images/noel/santa-sleigh.png"
        />
      </div>
    </div>
  );
}
