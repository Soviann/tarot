import { useEffect, useRef } from "react";

export function useCheatCode(code: string, onActivate: () => void): void {
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chars = code.toLowerCase().split("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (e.key.toLowerCase() === chars[indexRef.current]) {
        indexRef.current++;
        if (indexRef.current === chars.length) {
          indexRef.current = 0;
          onActivate();
          return;
        }
        timerRef.current = setTimeout(() => {
          indexRef.current = 0;
        }, 3000);
      } else {
        indexRef.current = 0;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chars, onActivate]);
}
