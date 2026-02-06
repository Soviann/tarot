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
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!animated) {
      setCurrent(target);
      return;
    }

    fromRef.current = current;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const value = Math.round(fromRef.current + (target - fromRef.current) * eased);

      setCurrent(value);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    let frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, duration, target]);

  return current;
}
