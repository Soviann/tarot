import { useEffect, useRef, useState } from "react";

interface UseAnimatedCounterOptions {
  animated?: boolean;
  duration?: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function useAnimatedCounter(
  target: number,
  { animated = true, duration = 500 }: UseAnimatedCounterOptions = {},
): number {
  const [current, setCurrent] = useState(animated ? 0 : target);
  const currentRef = useRef(animated ? 0 : target);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animated) {
      currentRef.current = target;
      setCurrent(target);
      return;
    }

    const from = currentRef.current;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = Math.round(from + (target - from) * eased);

      currentRef.current = value;
      setCurrent(value);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    let frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [animated, duration, target]);

  return current;
}
