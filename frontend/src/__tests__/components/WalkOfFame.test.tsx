import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WalkOfFame from "../../components/WalkOfFame";
import type { StarRankingEntry } from "../../types/api";
import { renderWithProviders } from "../test-utils";

const mockEntries: StarRankingEntry[] = [
  { playerColor: "#ff0000", playerId: 1, playerName: "Alice", stars: 5 },
  { playerColor: "#0000ff", playerId: 2, playerName: "Bob", stars: 3 },
];

function generateEntries(count: number): StarRankingEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    playerColor: null,
    playerId: i + 1,
    playerName: `Player ${i + 1}`,
    stars: 100 - i,
  }));
}

describe("WalkOfFame", () => {
  it("renders player names and star counts", () => {
    renderWithProviders(
      <WalkOfFame entries={mockEntries} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("5 ⭐")).toBeInTheDocument();
    expect(screen.getByText("3 ⭐")).toBeInTheDocument();
  });

  it("renders rank numbers", () => {
    renderWithProviders(
      <WalkOfFame entries={mockEntries} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("calls onPlayerClick when a row is tapped", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <WalkOfFame entries={mockEntries} onPlayerClick={onClick} />,
    );

    await user.click(screen.getByText("Alice"));

    expect(onClick).toHaveBeenCalledWith(1);
  });

  it("renders empty message when no entries", () => {
    renderWithProviders(
      <WalkOfFame entries={[]} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  describe("load more", () => {
    it("shows only 10 entries initially", () => {
      const entries = generateEntries(15);
      renderWithProviders(
        <WalkOfFame entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.getByText("Player 10")).toBeInTheDocument();
      expect(screen.queryByText("Player 11")).not.toBeInTheDocument();
    });

    it("reveals next batch on click", async () => {
      const user = userEvent.setup();
      const entries = generateEntries(15);
      renderWithProviders(
        <WalkOfFame entries={entries} onPlayerClick={() => {}} />,
      );

      await user.click(screen.getByRole("button", { name: /voir plus/i }));

      expect(screen.getByText("Player 11")).toBeInTheDocument();
      expect(screen.getByText("Player 15")).toBeInTheDocument();
    });
  });
});
