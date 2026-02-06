import { act, renderHook } from "@testing-library/react";
import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";

describe("useAnimatedCounter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let frameId = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frameId++;
      setTimeout(() => cb(performance.now()), 16);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns the target value immediately when not animated", () => {
    const { result } = renderHook(() =>
      useAnimatedCounter(42, { animated: false }),
    );

    expect(result.current).toBe(42);
  });

  it("reaches the target value after the animation duration", () => {
    const { result } = renderHook(() =>
      useAnimatedCounter(100, { duration: 500 }),
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current).toBe(100);
  });

  it("starts from 0 by default", () => {
    const { result } = renderHook(() =>
      useAnimatedCounter(100, { duration: 500 }),
    );

    expect(result.current).toBe(0);
  });

  it("handles negative values", () => {
    const { result } = renderHook(() =>
      useAnimatedCounter(-50, { duration: 500 }),
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current).toBe(-50);
  });

  it("animates to a new target when value changes", () => {
    const { rerender, result } = renderHook(
      ({ value }) => useAnimatedCounter(value, { duration: 500 }),
      { initialProps: { value: 100 } },
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe(100);

    rerender({ value: 200 });

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe(200);
  });
});
