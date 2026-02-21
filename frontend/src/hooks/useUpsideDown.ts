import { useCallback, useEffect, useRef, useState } from "react";

interface UseUpsideDownOptions {
  enabled?: boolean;
}

const ENTER_THRESHOLD = -60;
const EXIT_THRESHOLD = -30;

export function useUpsideDown(options?: UseUpsideDownOptions): boolean {
  const enabled = options?.enabled ?? true;
  const [isUpsideDown, setIsUpsideDown] = useState(false);
  const isUpsideDownRef = useRef(false);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.beta === null) return;

    if (!isUpsideDownRef.current && e.beta < ENTER_THRESHOLD) {
      isUpsideDownRef.current = true;
      setIsUpsideDown(true);
    } else if (isUpsideDownRef.current && e.beta > EXIT_THRESHOLD) {
      isUpsideDownRef.current = false;
      setIsUpsideDown(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("deviceorientation", handleOrientation as EventListener);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation as EventListener);
    };
  }, [enabled, handleOrientation]);

  return isUpsideDown;
}
