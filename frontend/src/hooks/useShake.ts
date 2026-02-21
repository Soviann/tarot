import { useCallback, useEffect, useRef } from "react";

interface UseShakeOptions {
  /** Disable the listener (e.g. when not on session page) */
  enabled?: boolean;
}

const SHAKE_THRESHOLD = 25;
const COOLDOWN_MS = 5000;

export function useShake(onShake: () => void, options?: UseShakeOptions) {
  const enabled = options?.enabled ?? true;
  const lastRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const cooldownRef = useRef(false);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const { x, y, z } = acc;

    if (lastRef.current) {
      const dx = Math.abs(x! - lastRef.current.x);
      const dy = Math.abs(y! - lastRef.current.y);
      const dz = Math.abs(z! - lastRef.current.z);
      const delta = dx + dy + dz;

      if (delta > SHAKE_THRESHOLD && !cooldownRef.current) {
        cooldownRef.current = true;
        onShakeRef.current();
        setTimeout(() => {
          cooldownRef.current = false;
        }, COOLDOWN_MS);
      }
    }

    lastRef.current = { x: x!, y: y!, z: z! };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("devicemotion", handleMotion as EventListener);
    return () => {
      window.removeEventListener("devicemotion", handleMotion as EventListener);
    };
  }, [enabled, handleMotion]);
}
