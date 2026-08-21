import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChristmasSnowfall from "../../components/ChristmasSnowfall";

let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
  }),
}));

vi.mock("../../services/christmasSeason", () => ({
  getChristmasSnowDuration: () => 5000,
}));

describe("ChristmasSnowfall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockResolvedTheme = "light";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when theme is not noel", () => {
    mockResolvedTheme = "light";
    render(<ChristmasSnowfall />);

    expect(screen.queryByTestId("christmas-snowfall")).not.toBeInTheDocument();
  });

  it("renders snowfall when theme is noel", () => {
    mockResolvedTheme = "noel";
    render(<ChristmasSnowfall />);

    expect(screen.getByTestId("christmas-snowfall")).toBeInTheDocument();
  });

  it("stops snowfall after duration expires", () => {
    mockResolvedTheme = "noel";
    render(<ChristmasSnowfall />);

    expect(screen.getByTestId("christmas-snowfall")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByTestId("christmas-snowfall")).not.toBeInTheDocument();
  });
});
