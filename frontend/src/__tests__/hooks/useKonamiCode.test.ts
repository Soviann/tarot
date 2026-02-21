import { renderHook } from "@testing-library/react";
import { act } from "react";
import type { MouseEvent } from "react";
import { useKonamiCode } from "../../hooks/useKonamiCode";

// Simulates a click at a specific position on a 100×100 element centered at (50, 50)
function createClickEvent(clientX: number, clientY: number): MouseEvent {
  return {
    clientX,
    clientY,
    currentTarget: {
      getBoundingClientRect: () => ({
        bottom: 100,
        height: 100,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
      }),
    },
  } as unknown as MouseEvent;
}

// Direction helpers — element center is (50, 50), radius=50
const clickUp = () => createClickEvent(50, 10);       // top zone
const clickDown = () => createClickEvent(50, 90);      // bottom zone
const clickLeft = () => createClickEvent(10, 50);      // left zone
const clickRight = () => createClickEvent(90, 50);     // right zone
const clickCenter = () => createClickEvent(50, 50);    // center zone

function performKonamiSequence(onClick: (e: MouseEvent) => void) {
  onClick(clickUp());
  onClick(clickUp());
  onClick(clickDown());
  onClick(clickDown());
  onClick(clickLeft());
  onClick(clickRight());
  onClick(clickLeft());
  onClick(clickRight());
  onClick(clickCenter());
  onClick(clickCenter());
}

describe("useKonamiCode", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onComplete when the full Konami sequence is performed", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useKonamiCode(onComplete));

    act(() => performKonamiSequence(result.current.onClick));

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("does not call onComplete for an incomplete sequence", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useKonamiCode(onComplete));

    act(() => {
      result.current.onClick(clickUp());
      result.current.onClick(clickUp());
      result.current.onClick(clickDown());
      result.current.onClick(clickDown());
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("resets on wrong input and requires full sequence again", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useKonamiCode(onComplete));

    act(() => {
      // Start correct: up, up
      result.current.onClick(clickUp());
      result.current.onClick(clickUp());
      // Wrong: right instead of down
      result.current.onClick(clickRight());
    });

    // Try full sequence again
    act(() => performKonamiSequence(result.current.onClick));

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("resets on timeout between gestures", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useKonamiCode(onComplete));

    act(() => {
      result.current.onClick(clickUp());
      result.current.onClick(clickUp());
    });

    // Advance past the 5s timeout
    act(() => vi.advanceTimersByTime(6000));

    // Continue the sequence — should not complete because of reset
    act(() => {
      result.current.onClick(clickDown());
      result.current.onClick(clickDown());
      result.current.onClick(clickLeft());
      result.current.onClick(clickRight());
      result.current.onClick(clickLeft());
      result.current.onClick(clickRight());
      result.current.onClick(clickCenter());
      result.current.onClick(clickCenter());
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("can be triggered again after a successful sequence", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useKonamiCode(onComplete));

    act(() => performKonamiSequence(result.current.onClick));
    expect(onComplete).toHaveBeenCalledOnce();

    act(() => performKonamiSequence(result.current.onClick));
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
