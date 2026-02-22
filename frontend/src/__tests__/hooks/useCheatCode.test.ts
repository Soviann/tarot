import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCheatCode } from "../../hooks/useCheatCode";

function pressKey(key: string) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key }));
}

describe("useCheatCode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects the sequence 'iddqd'", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode("iddqd", onActivate));

    for (const key of ["i", "d", "d", "q", "d"]) {
      pressKey(key);
    }

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("is case-insensitive", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode("iddqd", onActivate));

    for (const key of ["I", "D", "D", "Q", "D"]) {
      pressKey(key);
    }

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("resets after a wrong key", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode("iddqd", onActivate));

    pressKey("i");
    pressKey("d");
    pressKey("x"); // wrong key
    pressKey("d");
    pressKey("q");
    pressKey("d");

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("resets after 3s timeout between keypresses", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode("iddqd", onActivate));

    pressKey("i");
    pressKey("d");
    vi.advanceTimersByTime(3001);
    pressKey("d");
    pressKey("q");
    pressKey("d");

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("cleans up on unmount", () => {
    const onActivate = vi.fn();
    const { unmount } = renderHook(() => useCheatCode("iddqd", onActivate));

    unmount();

    for (const key of ["i", "d", "d", "q", "d"]) {
      pressKey(key);
    }

    expect(onActivate).not.toHaveBeenCalled();
  });
});
