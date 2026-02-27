import { useCallback, useEffect, useRef } from "react";

interface UseShakeOptions {
  /** Disable the listener (e.g. when not on session page) */
  enabled?: boolean;
}

const SHAKE_THRESHOLD = 25;
const COOLDOWN_MS = 30_000;

export function useShake(onShake: () => void, options?: UseShakeOptions) {
  const enabled = options?.enabled ?? true;
  const lastRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const lastTriggerRef = useRef(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const x = acc.x;
    const y = acc.y;
    const z = acc.z;

    if (lastRef.current) {
      const dx = Math.abs(x - lastRef.current.x);
      const dy = Math.abs(y - lastRef.current.y);
      const dz = Math.abs(z - lastRef.current.z);
      const delta = dx + dy + dz;

      if (delta > SHAKE_THRESHOLD && Date.now() - lastTriggerRef.current >= COOLDOWN_MS) {
        lastTriggerRef.current = Date.now();
        onShakeRef.current();
      }
    }

    lastRef.current = { x, y, z };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Reset baseline to prevent stale data from triggering a false shake
    lastRef.current = null;

    window.addEventListener("devicemotion", handleMotion as EventListener);
    return () => {
      window.removeEventListener("devicemotion", handleMotion as EventListener);
    };
  }, [enabled, handleMotion]);
}
