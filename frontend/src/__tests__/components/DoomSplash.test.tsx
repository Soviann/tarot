import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DoomSplash from "../../components/DoomSplash";

describe("DoomSplash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders logo when visible", () => {
    render(<DoomSplash onDone={vi.fn()} visible />);

    expect(screen.getByAltText("DOOM")).toBeInTheDocument();
  });

  it("renders nothing when not visible", () => {
    const { container } = render(<DoomSplash onDone={vi.fn()} visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("calls onDone after ~3s", () => {
    const onDone = vi.fn();
    render(<DoomSplash onDone={onDone} visible />);

    expect(onDone).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("does not call onDone if unmounted before timeout", () => {
    const onDone = vi.fn();
    const { unmount } = render(<DoomSplash onDone={onDone} visible />);

    vi.advanceTimersByTime(1000);
    unmount();
    vi.advanceTimersByTime(5000);

    expect(onDone).not.toHaveBeenCalled();
  });
});
