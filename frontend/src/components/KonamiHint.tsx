import { type ReactNode, useCallback, useState } from "react";
import { useHintCooldown } from "../hooks/useHintCooldown";

const HINT_CHANCE = 0.05;
const HINT_DURATION_MS = 2000;

interface KonamiHintProps {
  children?: ReactNode;
}

export default function KonamiHint({ children }: KonamiHintProps) {
  const [visible, setVisible] = useState(false);
  const { canShowHint, markHintShown } = useHintCooldown();

  const handleClick = useCallback(() => {
    if (!canShowHint() || Math.random() >= HINT_CHANCE) return;

    markHintShown();
    setVisible(true);
    setTimeout(() => setVisible(false), HINT_DURATION_MS);
  }, [canShowHint, markHintShown]);

  return (
    <div className="relative inline-flex" data-testid="konami-hint-trigger" onClick={handleClick}>
      {children}
      {visible && (
        <img
          alt="Konami"
          className="pointer-events-none absolute -top-6 left-1/2 z-50 w-8 -translate-x-1/2 animate-hint-fade"
          src="/images/konami-logo.png"
        />
      )}
    </div>
  );
}
