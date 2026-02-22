import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeSplash from "../../components/ThemeSplash";

describe("ThemeSplash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders image when visible", () => {
    render(<ThemeSplash imageSrc="/images/test-splash.png" onDone={vi.fn()} visible />);

    expect(screen.getByAltText("Theme splash")).toBeInTheDocument();
    expect(screen.getByAltText("Theme splash")).toHaveAttribute("src", "/images/test-splash.png");
  });

  it("renders nothing when not visible", () => {
    const { container } = render(<ThemeSplash imageSrc="/images/test-splash.png" onDone={vi.fn()} visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("calls onDone after ~3s", () => {
    const onDone = vi.fn();
    render(<ThemeSplash imageSrc="/images/test-splash.png" onDone={onDone} visible />);

    expect(onDone).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(onDone).toHaveBeenCalledOnce();
  });

  it("does not call onDone if unmounted before timeout", () => {
    const onDone = vi.fn();
    const { unmount } = render(<ThemeSplash imageSrc="/images/test-splash.png" onDone={onDone} visible />);

    vi.advanceTimersByTime(1000);
    unmount();
    vi.advanceTimersByTime(5000);

    expect(onDone).not.toHaveBeenCalled();
  });
});
