import { act, renderHook } from "@testing-library/react";
import { useHintCooldown } from "../../hooks/useHintCooldown";

const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

describe("useHintCooldown", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("canShowHint returns true when no hint has been shown yet", () => {
    const { result } = renderHook(() => useHintCooldown());
    expect(result.current.canShowHint()).toBe(true);
  });

  it("canShowHint returns false immediately after markHintShown", () => {
    const { result } = renderHook(() => useHintCooldown());

    act(() => result.current.markHintShown());

    expect(result.current.canShowHint()).toBe(false);
  });

  it("canShowHint returns true after cooldown has elapsed", () => {
    const { result } = renderHook(() => useHintCooldown());

    act(() => result.current.markHintShown());
    expect(result.current.canShowHint()).toBe(false);

    vi.advanceTimersByTime(COOLDOWN_MS + 1);

    expect(result.current.canShowHint()).toBe(true);
  });

  it("canShowHint returns false during cooldown", () => {
    const { result } = renderHook(() => useHintCooldown());

    act(() => result.current.markHintShown());

    vi.advanceTimersByTime(COOLDOWN_MS - 1000);

    expect(result.current.canShowHint()).toBe(false);
  });

  it("persists cooldown across hook instances via localStorage", () => {
    const { result: first } = renderHook(() => useHintCooldown());
    act(() => first.current.markHintShown());

    const { result: second } = renderHook(() => useHintCooldown());
    expect(second.current.canShowHint()).toBe(false);
  });
});
