import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useUpsideDown } from "../../hooks/useUpsideDown";

function fireDeviceOrientation(beta: number | null) {
  const event = new Event("deviceorientation") as DeviceOrientationEvent;
  Object.defineProperty(event, "beta", { value: beta });
  window.dispatchEvent(event);
}

describe("useUpsideDown", () => {
  it("returns false initially", () => {
    const { result } = renderHook(() => useUpsideDown());
    expect(result.current).toBe(false);
  });

  it("returns true when phone is upside down (beta < -60)", () => {
    const { result } = renderHook(() => useUpsideDown());

    act(() => {
      fireDeviceOrientation(-90);
    });

    expect(result.current).toBe(true);
  });

  it("returns false for normal orientation (beta ~90)", () => {
    const { result } = renderHook(() => useUpsideDown());

    act(() => {
      fireDeviceOrientation(85);
    });

    expect(result.current).toBe(false);
  });

  it("uses hysteresis — needs beta > -30 to exit upside-down", () => {
    const { result } = renderHook(() => useUpsideDown());

    // Go upside down
    act(() => {
      fireDeviceOrientation(-70);
    });
    expect(result.current).toBe(true);

    // Beta at -45 — still in hysteresis zone, should stay upside down
    act(() => {
      fireDeviceOrientation(-45);
    });
    expect(result.current).toBe(true);

    // Beta > -30 — should exit upside down
    act(() => {
      fireDeviceOrientation(-20);
    });
    expect(result.current).toBe(false);
  });

  it("ignores null beta", () => {
    const { result } = renderHook(() => useUpsideDown());

    act(() => {
      fireDeviceOrientation(null);
    });

    expect(result.current).toBe(false);
  });

  it("does nothing when disabled", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    renderHook(() => useUpsideDown({ enabled: false }));

    expect(addSpy).not.toHaveBeenCalledWith("deviceorientation", expect.any(Function));
    addSpy.mockRestore();
  });

  it("cleans up event listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useUpsideDown());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("deviceorientation", expect.any(Function));
    removeSpy.mockRestore();
  });
});
