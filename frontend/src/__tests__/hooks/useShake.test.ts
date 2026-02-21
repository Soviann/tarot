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

  it("calls onShake when acceleration exceeds threshold", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    act(() => {
      // First event sets baseline
      fireDeviceMotion(0, 0, 9.8);
    });

    act(() => {
      // Second event with big delta triggers shake
      fireDeviceMotion(30, 30, 9.8);
    });

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

  it("respects cooldown period between shakes", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    act(() => {
      fireDeviceMotion(0, 0, 9.8);
    });

    act(() => {
      fireDeviceMotion(30, 30, 9.8);
    });

    expect(onShake).toHaveBeenCalledOnce();

    // Shake again immediately — should be ignored (cooldown)
    act(() => {
      fireDeviceMotion(0, 0, 9.8);
    });
    act(() => {
      fireDeviceMotion(30, 30, 9.8);
    });

    expect(onShake).toHaveBeenCalledOnce();

    // After cooldown (5s), shake should work again
    act(() => vi.advanceTimersByTime(5000));

    act(() => {
      fireDeviceMotion(0, 0, 9.8);
    });
    act(() => {
      fireDeviceMotion(30, 30, 9.8);
    });

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
});
