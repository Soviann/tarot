import { Undo2 } from "lucide-react";
import { useEffect, useRef } from "react";

const COUNTDOWN_DURATION = 5000;
const CIRCLE_RADIUS = 25;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

interface UndoFABProps {
  onDismiss: () => void;
  onUndo: () => void;
}

export default function UndoFAB({ onDismiss, onUndo }: UndoFABProps) {
  const dismissed = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed.current) {
        onDismiss();
      }
    }, COUNTDOWN_DURATION);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  function handleClick() {
    dismissed.current = true;
    onUndo();
  }

  return (
    <button
      aria-label="Annuler la donne"
      className="fixed bottom-20 left-4 z-10 flex size-14 items-center justify-center rounded-full bg-surface-secondary text-text-primary shadow-lg transition-transform active:scale-95"
      onClick={handleClick}
      type="button"
    >
      <Undo2 size={24} />
      <svg
        className="pointer-events-none absolute inset-0"
        height="56"
        width="56"
      >
        <circle
          className="animate-undo-countdown"
          cx="28"
          cy="28"
          fill="none"
          r={CIRCLE_RADIUS}
          stroke="currentColor"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeWidth="3"
          transform="rotate(-90 28 28)"
        />
      </svg>
    </button>
  );
}
