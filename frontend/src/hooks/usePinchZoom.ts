import { useCallback, useEffect, useRef, useState } from "react";

interface UsePinchZoomOptions {
  dataLength: number;
  enabled?: boolean;
}

interface UsePinchZoomResult {
  chartRef: (node: HTMLDivElement | null) => void;
  domain: [number, number];
  resetZoom: () => void;
  zoomLevel: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 20;
const WHEEL_STEP = 0.2;
const DOUBLE_TAP_DELAY = 300;

function clampCenter(center: number, dataLength: number, windowSize: number): number {
  const half = windowSize / 2;
  return Math.max(1 + half, Math.min(dataLength - half, center));
}

function computeDomain(
  dataLength: number,
  zoomLevel: number,
  centerIndex: number,
): [number, number] {
  if (zoomLevel <= 1) return [1, dataLength];

  const windowSize = dataLength / zoomLevel;
  const clamped = clampCenter(centerIndex, dataLength, windowSize);
  const min = Math.max(1, Math.round(clamped - windowSize / 2));
  const max = Math.min(dataLength, Math.round(clamped + windowSize / 2));

  return [min, max];
}

function getTouchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function usePinchZoom({
  dataLength,
  enabled = true,
}: UsePinchZoomOptions): UsePinchZoomResult {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [centerIndex, setCenterIndex] = useState((dataLength + 1) / 2);

  const lastTapRef = useRef(0);
  const basePinchZoomRef = useRef(MIN_ZOOM);
  const basePinchDistanceRef = useRef(0);
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const centerRef = useRef(centerIndex);
  centerRef.current = centerIndex;

  // Drag state
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartCenterRef = useRef(0);

  const chartRef = useCallback((el: HTMLDivElement | null) => {
    setNode(el);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setCenterIndex((dataLength + 1) / 2);
  }, [dataLength]);

  const panBy = useCallback(
    (deltaPixels: number) => {
      if (!node || zoomLevelRef.current <= 1) return;
      const containerWidth = node.clientWidth;
      if (containerWidth <= 0) return;
      const windowSize = dataLength / zoomLevelRef.current;
      const deltaData = (deltaPixels / containerWidth) * windowSize;
      setCenterIndex((prev) => clampCenter(prev + deltaData, dataLength, windowSize));
    },
    [dataLength, node],
  );

  useEffect(() => {
    if (!node || !enabled) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.shiftKey && zoomLevelRef.current > 1) {
        // Shift+wheel = horizontal scroll
        const direction = e.deltaY > 0 ? 1 : -1;
        const windowSize = dataLength / zoomLevelRef.current;
        const step = windowSize * 0.1;
        setCenterIndex((prev) => clampCenter(prev + direction * step, dataLength, windowSize));
      } else {
        setZoomLevel((prev) => {
          const direction = e.deltaY < 0 ? 1 : -1;
          return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + direction * WHEEL_STEP));
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (zoomLevelRef.current <= 1) return;
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      dragStartXRef.current = e.clientX;
      dragStartCenterRef.current = centerRef.current;
      node.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      hasDraggedRef.current = true;
      const deltaX = dragStartXRef.current - e.clientX;
      const containerWidth = node.clientWidth;
      if (containerWidth <= 0) return;
      const windowSize = dataLength / zoomLevelRef.current;
      const deltaData = (deltaX / containerWidth) * windowSize;
      setCenterIndex(clampCenter(dragStartCenterRef.current + deltaData, dataLength, windowSize));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        node.style.cursor = zoomLevelRef.current > 1 ? "grab" : "";
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        basePinchDistanceRef.current = getTouchDistance(e.touches);
        basePinchZoomRef.current = zoomLevelRef.current;
        isDraggingRef.current = false;
      } else if (e.touches.length === 1 && zoomLevelRef.current > 1) {
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        dragStartXRef.current = e.touches[0].clientX;
        dragStartCenterRef.current = centerRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && basePinchDistanceRef.current > 0) {
        isDraggingRef.current = false;
        const currentDistance = getTouchDistance(e.touches);
        const ratio = currentDistance / basePinchDistanceRef.current;
        setZoomLevel(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, basePinchZoomRef.current * ratio)));
      } else if (e.touches.length === 1 && isDraggingRef.current) {
        hasDraggedRef.current = true;
        const deltaX = dragStartXRef.current - e.touches[0].clientX;
        const containerWidth = node.clientWidth;
        if (containerWidth <= 0) return;
        const windowSize = dataLength / zoomLevelRef.current;
        const deltaData = (deltaX / containerWidth) * windowSize;
        setCenterIndex(clampCenter(dragStartCenterRef.current + deltaData, dataLength, windowSize));
      }
    };

    const handleTouchEnd = () => {
      const wasDragging = hasDraggedRef.current;
      isDraggingRef.current = false;
      basePinchDistanceRef.current = 0;
      if (wasDragging) return;
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        resetZoom();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    const handleDblClick = () => {
      resetZoom();
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    node.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    node.addEventListener("touchstart", handleTouchStart);
    node.addEventListener("touchmove", handleTouchMove);
    node.addEventListener("touchend", handleTouchEnd);
    node.addEventListener("dblclick", handleDblClick);

    return () => {
      node.removeEventListener("wheel", handleWheel);
      node.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      node.removeEventListener("dblclick", handleDblClick);
    };
  }, [dataLength, enabled, node, panBy, resetZoom]);

  // Update cursor when zoom changes
  useEffect(() => {
    if (!node) return;
    node.style.cursor = zoomLevel > 1 ? "grab" : "";
  }, [node, zoomLevel]);

  const domain = computeDomain(dataLength, zoomLevel, centerIndex);

  return { chartRef, domain, resetZoom, zoomLevel };
}
