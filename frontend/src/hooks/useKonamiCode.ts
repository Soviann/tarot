import { useCallback, useRef } from "react";
import type { MouseEvent } from "react";

/**
 * Détecte la séquence Konami via des taps positionnels sur un élément :
 * haut ×2, bas ×2, gauche, droite, gauche, droite, centre ×2
 *
 * La direction est déterminée par la zone cliquée sur l'élément :
 * - Haut/bas si le clic est plus éloigné verticalement du centre
 * - Gauche/droite si le clic est plus éloigné horizontalement
 * - Centre si le clic est proche du centre (< 25% du rayon)
 *
 * Réinitialise si mauvaise entrée ou timeout de 5s entre les taps.
 */

type Direction = "center" | "down" | "left" | "right" | "up";

const KONAMI_SEQUENCE: Direction[] = [
  "up", "up", "down", "down", "left", "right", "left", "right", "center", "center",
];

const CENTER_THRESHOLD = 0.25;
const TIMEOUT_MS = 5000;

function getDirection(e: MouseEvent): Direction {
  const rect = e.currentTarget.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = e.clientX - cx;
  const dy = e.clientY - cy;
  const radius = Math.max(rect.width, rect.height) / 2;

  if (Math.abs(dx) < radius * CENTER_THRESHOLD && Math.abs(dy) < radius * CENTER_THRESHOLD) {
    return "center";
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "down" : "up";
}

export function useKonamiCode(onComplete: () => void) {
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    indexRef.current = 0;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onClick = useCallback(
    (e: MouseEvent) => {
      const direction = getDirection(e);

      if (KONAMI_SEQUENCE[indexRef.current] === direction) {
        indexRef.current++;
        if (timerRef.current) clearTimeout(timerRef.current);

        if (indexRef.current >= KONAMI_SEQUENCE.length) {
          reset();
          onComplete();
        } else {
          timerRef.current = setTimeout(reset, TIMEOUT_MS);
        }
      } else {
        reset();
      }
    },
    [onComplete, reset],
  );

  return { onClick };
}
