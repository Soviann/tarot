import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DoomSplashProps {
  onDone: () => void;
  visible: boolean;
}

export default function DoomSplash({ onDone, visible }: DoomSplashProps) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    setPhase("in");

    timerRef.current = setTimeout(() => {
      setPhase("out");
      timerRef.current = setTimeout(() => {
        onDone();
      }, 300);
    }, 2700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDone, visible]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black ${
        phase === "in" ? "animate-doom-fade-in" : "animate-doom-fade-out"
      }`}
    >
      <img
        alt="DOOM"
        className="max-h-[50vh] max-w-[80vw] object-contain"
        src="/images/doom/doom-logo.png"
      />
    </div>,
    document.body,
  );
}
