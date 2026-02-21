import { renderHook } from "@testing-library/react";
import { useResetOnOpen } from "../../hooks/useResetOnOpen";

describe("useResetOnOpen", () => {
  it("calls the callback when open becomes true", () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ open }) => useResetOnOpen(open, callback),
      { initialProps: { open: false } },
    );

    expect(callback).not.toHaveBeenCalled();

    rerender({ open: true });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call the callback when open becomes false", () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ open }) => useResetOnOpen(open, callback),
      { initialProps: { open: true } },
    );

    // Called once on initial render (open=true)
    callback.mockClear();

    rerender({ open: false });
    expect(callback).not.toHaveBeenCalled();
  });

  it("calls the callback again when modal reopens", () => {
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ open }) => useResetOnOpen(open, callback),
      { initialProps: { open: false } },
    );

    rerender({ open: true });
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ open: false });
    rerender({ open: true });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("does not call callback when other props change", () => {
    const callback = vi.fn();
    const newCallback = vi.fn();

    const { rerender } = renderHook(
      ({ cb, open }) => useResetOnOpen(open, cb),
      { initialProps: { cb: callback, open: true } },
    );

    callback.mockClear();

    // Change callback reference but keep open=true
    rerender({ cb: newCallback, open: true });
    expect(callback).not.toHaveBeenCalled();
    expect(newCallback).not.toHaveBeenCalled();
  });
});
