import { useCallback, useEffect, useState } from "react";
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
  icon: string;
  startX: string;
  startY: string;
  endX: string;
  endY: string;
}

function randomTraverse(): TraverseState {
  const icon = DOOM_ICONS[Math.floor(Math.random() * DOOM_ICONS.length)];
  const direction = Math.floor(Math.random() * 4);
  const perpendicular = `${Math.random() * 80 + 10}vh`;

  switch (direction) {
    case 0: // left to right
      return { icon, startX: "-32px", startY: perpendicular, endX: "calc(100vw + 32px)", endY: perpendicular };
    case 1: // right to left
      return { icon, startX: "calc(100vw + 32px)", startY: perpendicular, endX: "-32px", endY: perpendicular };
    case 2: // top to bottom
      return { icon, startX: perpendicular, startY: "-32px", endX: perpendicular, endY: "calc(100vh + 32px)" };
    default: // bottom to top
      return { icon, startX: perpendicular, startY: "calc(100vh + 32px)", endX: perpendicular, endY: "-32px" };
  }
}

export default function DoomHint() {
  const [traverse, setTraverse] = useState<TraverseState | null>(null);
  const { canShowHint, markHintShown } = useHintCooldown();

  const handleClick = useCallback(() => {
    if (!canShowHint() || Math.random() >= HINT_CHANCE) return;

    markHintShown();
    setTraverse(randomTraverse());
    setTimeout(() => setTraverse(null), HINT_DURATION_MS);
  }, [canShowHint, markHintShown]);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
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
