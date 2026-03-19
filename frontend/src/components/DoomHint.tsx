import { useCallback, useEffect, useRef, useState } from "react";
import { useHintCooldown } from "../hooks/useHintCooldown";

const HINT_CHANCE = 0.02;
const HINT_DURATION_MS = 2000;

const DOOM_ICONS = [
  "/images/doom/doom-bleeding-32x32.png",
  "/images/doom/doom-demon-2-32x32.png",
  "/images/doom/doom-demon-32x32.png",
  "/images/doom/doom-demon-green-32x32.png",
  "/images/doom/doom-demon-red-32x32.png",
  "/images/doom/doom-marine-2-32x32.png",
  "/images/doom/doom-marine-32x32.png",
] as const;

interface TraverseState {
  endX: string;
  endY: string;
  icon: string;
  startX: string;
  startY: string;
}

function randomTraverse(): TraverseState {
  const icon = DOOM_ICONS[Math.floor(Math.random() * DOOM_ICONS.length)];
  const direction = Math.floor(Math.random() * 4);
  const offset = Math.random() * 80 + 10;

  switch (direction) {
    case 0: // left to right
      return { endX: "calc(100vw + 32px)", endY: `${offset}vh`, icon, startX: "-32px", startY: `${offset}vh` };
    case 1: // right to left
      return { endX: "-32px", endY: `${offset}vh`, icon, startX: "calc(100vw + 32px)", startY: `${offset}vh` };
    case 2: // top to bottom
      return { endX: `${offset}vw`, endY: "calc(100vh + 32px)", icon, startX: `${offset}vw`, startY: "-32px" };
    default: // bottom to top
      return { endX: `${offset}vw`, endY: "-32px", icon, startX: `${offset}vw`, startY: "calc(100vh + 32px)" };
  }
}

export default function DoomHint() {
  const [traverse, setTraverse] = useState<TraverseState | null>(null);
  const { canShowHint, markHintShown } = useHintCooldown();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleClick = useCallback(() => {
    if (!canShowHint() || Math.random() >= HINT_CHANCE) return;

    markHintShown();
    setTraverse(randomTraverse());
    timerRef.current = setTimeout(() => setTraverse(null), HINT_DURATION_MS);
  }, [canShowHint, markHintShown]);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearTimeout(timerRef.current);
    };
  }, [handleClick]);

  if (!traverse) return null;

  return (
    <img
      alt=""
      className="pointer-events-none fixed left-0 top-0 z-50 size-8 animate-doom-traverse"
      data-testid="doom-hint-icon"
      src={traverse.icon}
      style={{
        "--hint-end-x": traverse.endX,
        "--hint-end-y": traverse.endY,
        "--hint-start-x": traverse.startX,
        "--hint-start-y": traverse.startY,
      } as React.CSSProperties}
    />
  );
}
