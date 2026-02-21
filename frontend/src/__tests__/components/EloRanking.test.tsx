import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EloRanking from "../../components/EloRanking";
import type { EloRankingEntry } from "../../types/api";
import { renderWithProviders } from "../test-utils";

function generateEntries(count: number): EloRankingEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    eloRating: 1600 - i * 10,
    gamesPlayed: 20,
    playerColor: null,
    playerId: i + 1,
    playerName: `Player ${i + 1}`,
  }));
}

describe("EloRanking", () => {
  it("renders player names and elo ratings", () => {
    const entries = generateEntries(3);
    renderWithProviders(
      <EloRanking entries={entries} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("1600")).toBeInTheDocument();
  });

  it("renders empty message when no entries", () => {
    renderWithProviders(
      <EloRanking entries={[]} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  describe("load more", () => {
    it("shows only 10 entries initially", () => {
      const entries = generateEntries(15);
      renderWithProviders(
        <EloRanking entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.getByText("Player 10")).toBeInTheDocument();
      expect(screen.queryByText("Player 11")).not.toBeInTheDocument();
    });

    it("does not show load more button when 10 or fewer entries", () => {
      const entries = generateEntries(10);
      renderWithProviders(
        <EloRanking entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.queryByRole("button", { name: /voir plus/i })).not.toBeInTheDocument();
    });

    it("shows load more button with remaining count", () => {
      const entries = generateEntries(11);
      renderWithProviders(
        <EloRanking entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.getByRole("button", { name: /voir plus/i })).toHaveTextContent("Voir plus (1)");
    });

    it("reveals next batch of entries on click", async () => {
      const user = userEvent.setup();
      const entries = generateEntries(25);
      renderWithProviders(
        <EloRanking entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.queryByText("Player 11")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /voir plus/i }));

      expect(screen.getByText("Player 11")).toBeInTheDocument();
      expect(screen.getByText("Player 20")).toBeInTheDocument();
      expect(screen.queryByText("Player 21")).not.toBeInTheDocument();
    });

    it("hides load more button when all entries are visible", async () => {
      const user = userEvent.setup();
      const entries = generateEntries(15);
      renderWithProviders(
        <EloRanking entries={entries} onPlayerClick={() => {}} />,
      );

      await user.click(screen.getByRole("button", { name: /voir plus/i }));

      expect(screen.getByText("Player 15")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /voir plus/i })).not.toBeInTheDocument();
    });
  });
});
