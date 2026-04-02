import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useShake } from "../../hooks/useShake";

function fireDeviceMotion(x: number, y: number, z: number) {
  const event = new Event("devicemotion") as DeviceMotionEvent;
  Object.defineProperty(event, "accelerationIncludingGravity", {
    value: { x, y, z },
  });
  window.dispatchEvent(event);
}

describe("useShake", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onShake when sustained acceleration exceeds threshold", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    // Baseline
    act(() => fireDeviceMotion(0, 0, 9.8));

    // Sustained shaking — 3 consecutive high deltas
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));

    expect(onShake).toHaveBeenCalledOnce();
  });

  it("does not call onShake for gentle movement", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    act(() => {
      fireDeviceMotion(0, 0, 9.8);
    });

    act(() => {
      fireDeviceMotion(1, 1, 9.8);
    });

    expect(onShake).not.toHaveBeenCalled();
  });

  it("does not trigger on a single spike (requires sustained shaking)", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    // Baseline
    act(() => fireDeviceMotion(0, 0, 9.8));

    // Single spike above threshold — should NOT trigger
    act(() => fireDeviceMotion(30, 30, 9.8));

    // Back to calm
    act(() => fireDeviceMotion(0, 0, 9.8));

    expect(onShake).not.toHaveBeenCalled();
  });

  it("triggers after multiple consecutive high-acceleration samples", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    // Baseline
    act(() => fireDeviceMotion(0, 0, 9.8));

    // Sustained shaking — multiple consecutive high deltas
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));

    expect(onShake).toHaveBeenCalledOnce();
  });

  it("respects cooldown period between shakes", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    // First sustained shake
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));

    expect(onShake).toHaveBeenCalledOnce();

    // Shake again immediately — should be ignored (cooldown)
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));

    expect(onShake).toHaveBeenCalledOnce();

    // After cooldown (30s), shake should work again
    act(() => vi.advanceTimersByTime(30000));

    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));

    expect(onShake).toHaveBeenCalledTimes(2);
  });

  it("cleans up event listener on unmount", () => {
    const onShake = vi.fn();
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useShake(onShake));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("devicemotion", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("does nothing when disabled", () => {
    const onShake = vi.fn();
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useShake(onShake, { enabled: false }));

    // Should not register listener
    expect(addSpy).not.toHaveBeenCalledWith("devicemotion", expect.any(Function));
    addSpy.mockRestore();
  });

  it("cooldown persists across disable/re-enable cycles", () => {
    const onShake = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useShake(onShake, { enabled }),
      { initialProps: { enabled: true } },
    );

    // Trigger a sustained shake
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));
    expect(onShake).toHaveBeenCalledOnce();

    // Disable (simulates easter egg animation playing)
    rerender({ enabled: false });

    // Advance past the old cooldown duration
    act(() => vi.advanceTimersByTime(10000));

    // Re-enable (simulates animation finished)
    rerender({ enabled: true });

    // Shake again immediately — should NOT trigger (cooldown still active)
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));
    act(() => fireDeviceMotion(0, 0, 9.8));
    act(() => fireDeviceMotion(30, 30, 9.8));

    expect(onShake).toHaveBeenCalledOnce();
  });

  it("resets baseline after re-enabling to prevent stale data false trigger", () => {
    const onShake = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useShake(onShake, { enabled }),
      { initialProps: { enabled: true } },
    );

    // Establish baseline at (0, 0, 9.8)
    act(() => fireDeviceMotion(0, 0, 9.8));

    // Disable the hook
    rerender({ enabled: false });

    // Re-enable after cooldown expires
    act(() => vi.advanceTimersByTime(30000));
    rerender({ enabled: true });

    // First event after re-enable: delta from stale lastRef would be huge
    // but it should set a new baseline, not trigger
    act(() => fireDeviceMotion(20, 20, 9.8));

    expect(onShake).not.toHaveBeenCalled();
  });
});
