import { act, renderHook } from "@testing-library/react";
import { usePinchZoom } from "../../hooks/usePinchZoom";

function createWheelEvent(deltaY: number, shiftKey = false): WheelEvent {
  return new WheelEvent("wheel", { bubbles: true, deltaY, shiftKey });
}

function createTouchEvent(
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
): TouchEvent {
  const touchList = touches.map(
    (t) =>
      ({
        clientX: t.clientX,
        clientY: t.clientY,
      }) as Touch,
  );
  return new TouchEvent(type, {
    bubbles: true,
    touches: type === "touchend" ? [] : touchList,
  });
}

describe("usePinchZoom", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    // Give container a width for pan calculations
    Object.defineProperty(container, "clientWidth", { configurable: true, value: 400 });
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function attachRef(result: { current: ReturnType<typeof usePinchZoom> }) {
    act(() => {
      result.current.chartRef(container);
    });
  }

  it("returns initial state: zoomLevel=1, domain=[1, dataLength]", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );

    expect(result.current.zoomLevel).toBe(1);
    expect(result.current.domain).toEqual([1, 20]);
  });

  it("zooms in on wheel deltaY < 0", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
    });

    expect(result.current.zoomLevel).toBeGreaterThan(1);
    const [min, max] = result.current.domain;
    expect(max - min).toBeLessThan(19);
  });

  it("zooms out on wheel deltaY > 0 (min 1)", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
      container.dispatchEvent(createWheelEvent(-100));
    });
    const zoomAfterIn = result.current.zoomLevel;

    act(() => {
      container.dispatchEvent(createWheelEvent(100));
    });

    expect(result.current.zoomLevel).toBeLessThan(zoomAfterIn);
    expect(result.current.zoomLevel).toBeGreaterThanOrEqual(1);
  });

  it("clamps zoom to [1, 20]", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 100 }),
    );
    attachRef(result);

    act(() => {
      for (let i = 0; i < 200; i++) {
        container.dispatchEvent(createWheelEvent(-100));
      }
    });
    expect(result.current.zoomLevel).toBe(20);

    act(() => {
      for (let i = 0; i < 200; i++) {
        container.dispatchEvent(createWheelEvent(100));
      }
    });
    expect(result.current.zoomLevel).toBe(1);
  });

  it("clamps domain to data bounds", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 10 }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
    });

    const [min, max] = result.current.domain;
    expect(min).toBeGreaterThanOrEqual(1);
    expect(max).toBeLessThanOrEqual(10);
  });

  it("zooms in on pinch (fingers spreading apart)", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(
        createTouchEvent("touchstart", [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 },
        ]),
      );
    });

    act(() => {
      container.dispatchEvent(
        createTouchEvent("touchmove", [
          { clientX: 50, clientY: 100 },
          { clientX: 170, clientY: 100 },
        ]),
      );
    });

    expect(result.current.zoomLevel).toBeGreaterThan(1);
  });

  it("zooms out on pinch (fingers coming together)", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    act(() => {
      for (let i = 0; i < 10; i++) {
        container.dispatchEvent(createWheelEvent(-100));
      }
    });
    const zoomAfterIn = result.current.zoomLevel;

    act(() => {
      container.dispatchEvent(
        createTouchEvent("touchstart", [
          { clientX: 50, clientY: 100 },
          { clientX: 170, clientY: 100 },
        ]),
      );
    });

    act(() => {
      container.dispatchEvent(
        createTouchEvent("touchmove", [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 100 },
        ]),
      );
    });

    expect(result.current.zoomLevel).toBeLessThan(zoomAfterIn);
  });

  it("resets zoom on double-tap", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
      container.dispatchEvent(createWheelEvent(-100));
    });
    expect(result.current.zoomLevel).toBeGreaterThan(1);

    act(() => {
      container.dispatchEvent(createTouchEvent("touchend", []));
    });
    act(() => {
      container.dispatchEvent(createTouchEvent("touchend", []));
    });

    expect(result.current.zoomLevel).toBe(1);
    expect(result.current.domain).toEqual([1, 20]);
  });

  it("resets zoom on double-click", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
    });
    expect(result.current.zoomLevel).toBeGreaterThan(1);

    act(() => {
      container.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });

    expect(result.current.zoomLevel).toBe(1);
  });

  it("pans with shift+wheel when zoomed", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 40 }),
    );
    attachRef(result);

    // Zoom in first
    act(() => {
      for (let i = 0; i < 10; i++) {
        container.dispatchEvent(createWheelEvent(-100));
      }
    });
    const domainBefore = [...result.current.domain];

    // Shift+wheel to pan right
    act(() => {
      container.dispatchEvent(createWheelEvent(100, true));
    });

    const domainAfter = result.current.domain;
    // Domain should have shifted right
    expect(domainAfter[0]).toBeGreaterThan(domainBefore[0]);
    expect(domainAfter[1]).toBeGreaterThan(domainBefore[1]);
  });

  it("pans with mouse drag when zoomed", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 40 }),
    );
    attachRef(result);

    // Zoom in
    act(() => {
      for (let i = 0; i < 10; i++) {
        container.dispatchEvent(createWheelEvent(-100));
      }
    });
    const domainBefore = [...result.current.domain];

    // Mouse drag right (drag start → move left = pan right)
    act(() => {
      container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 200 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 100 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    const domainAfter = result.current.domain;
    expect(domainAfter[0]).toBeGreaterThan(domainBefore[0]);
  });

  it("does not pan with mouse drag when not zoomed", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    const domainBefore = [...result.current.domain];

    act(() => {
      container.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 200 }));
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 100 }));
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    expect(result.current.domain).toEqual(domainBefore);
  });

  it("pans with single-touch drag when zoomed", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 40 }),
    );
    attachRef(result);

    // Zoom in
    act(() => {
      for (let i = 0; i < 10; i++) {
        container.dispatchEvent(createWheelEvent(-100));
      }
    });
    const domainBefore = [...result.current.domain];

    // Touch drag
    act(() => {
      container.dispatchEvent(
        createTouchEvent("touchstart", [{ clientX: 200, clientY: 100 }]),
      );
      container.dispatchEvent(
        createTouchEvent("touchmove", [{ clientX: 100, clientY: 100 }]),
      );
    });

    const domainAfter = result.current.domain;
    expect(domainAfter[0]).toBeGreaterThan(domainBefore[0]);
  });

  it("does not attach listeners when enabled=false", () => {
    const { result } = renderHook(() =>
      usePinchZoom({ dataLength: 20, enabled: false }),
    );
    attachRef(result);

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
    });

    expect(result.current.zoomLevel).toBe(1);
  });

  it("cleans up listeners on unmount", () => {
    const { result, unmount } = renderHook(() =>
      usePinchZoom({ dataLength: 20 }),
    );
    attachRef(result);

    unmount();

    act(() => {
      container.dispatchEvent(createWheelEvent(-100));
    });
  });
});
