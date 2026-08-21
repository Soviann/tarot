import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { getChristmasSnowDuration } from "../services/christmasSeason";

const SNOWFLAKE_ICONS = ["❄", "❅", "❆", "•"] as const;
const FLAKE_COUNT = 30;

interface Flake {
  animationDuration: string;
  fontSize: string;
  icon: string;
  id: number;
  left: string;
  opacity: number;
  swayDuration: string;
}

function generateFlakes(count: number): Flake[] {
  return Array.from({ length: count }, (_, i) => ({
    animationDuration: `${(Math.random() * 4 + 4).toFixed(1)}s`,
    fontSize: `${(Math.random() * 1.2 + 0.6).toFixed(1)}rem`,
    icon: SNOWFLAKE_ICONS[Math.floor(Math.random() * SNOWFLAKE_ICONS.length)],
    id: i,
    left: `${(Math.random() * 100).toFixed(1)}vw`,
    opacity: Number((Math.random() * 0.7 + 0.3).toFixed(2)),
    swayDuration: `${(Math.random() * 2 + 2).toFixed(1)}s`,
  }));
}

export default function ChristmasSnowfall() {
  const { resolvedTheme } = useTheme();
  const isNoel = resolvedTheme === "noel";
  const [active, setActive] = useState(false);
  const [flakes, setFlakes] = useState<Flake[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!isNoel) {
      setActive(false);
      setFlakes([]);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let isMounted = true;

    function startSnowSession() {
      if (!isMounted) return;
      setFlakes(generateFlakes(FLAKE_COUNT));
      setActive(true);

      const duration = getChristmasSnowDuration();
      timerRef.current = setTimeout(() => {
        if (!isMounted) return;
        setActive(false);
        // Wait a random cooldown between 20s and 60s before next snowfall session
        const nextCooldown = Math.floor(Math.random() * 40_000) + 20_000;
        timerRef.current = setTimeout(startSnowSession, nextCooldown);
      }, duration);
    }

    startSnowSession();

    return () => {
      isMounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isNoel]);

  if (!isNoel || !active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      data-testid="christmas-snowfall"
    >
      {flakes.map((flake) => (
        <span
          className="absolute -top-6 select-none text-white will-change-transform"
          key={flake.id}
          style={{
            animationDuration: `${flake.animationDuration}, ${flake.swayDuration}`,
            animationIterationCount: "infinite, infinite",
            animationName: "snowfall, snow-sway",
            animationTimingFunction: "linear, ease-in-out",
            fontSize: flake.fontSize,
            left: flake.left,
            opacity: flake.opacity,
          }}
        >
          {flake.icon}
        </span>
      ))}
    </div>
  );
}
