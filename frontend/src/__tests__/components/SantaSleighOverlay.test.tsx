import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SantaSleighOverlay from "../../components/SantaSleighOverlay";
import { gameEvents } from "../../services/gameEvents";

let mockResolvedTheme = "noel";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
  }),
}));

vi.mock("../../services/christmasSeason", () => ({
  getSleighChance: () => 1.0, // 100% chance for testing
  isChristmasPeriod: () => true,
}));

describe("SantaSleighOverlay", () => {
  const mockPlay = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    mockPlay.mockClear();
    vi.stubGlobal(
      "Audio",
      class {
        play = mockPlay;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not render when not triggered", () => {
    render(<SantaSleighOverlay />);
    expect(screen.queryByTestId("santa-sleigh-overlay")).not.toBeInTheDocument();
  });

  it("triggers animation and plays Ho Ho Ho sound upon game:completed event", () => {
    render(<SantaSleighOverlay />);

    act(() => {
      gameEvents.emit("game:completed", {
        context: {
          attackWins: true,
          chelem: "none",
          consecutiveLosses: 0,
          contract: "garde",
          isSelfCall: false,
          oudlers: 2,
          petitAuBout: "none",
          points: 50,
          previousScore: null,
          takerScore: 40,
        },
        cumulativeScores: [],
        previousCumulativeScores: [],
      });
    });

    expect(screen.getByTestId("santa-sleigh-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("santa-sleigh-image")).toHaveAttribute(
      "src",
      "/images/noel/santa-sleigh.png",
    );
    expect(mockPlay).toHaveBeenCalled();

    // Advance timer past animation duration
    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(screen.queryByTestId("santa-sleigh-overlay")).not.toBeInTheDocument();
  });
});
