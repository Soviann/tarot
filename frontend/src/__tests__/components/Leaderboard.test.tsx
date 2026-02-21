import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Leaderboard from "../../components/Leaderboard";
import type { LeaderboardEntry } from "../../types/api";
import { renderWithProviders } from "../test-utils";

vi.mock("react-countup", () => ({
  default: ({ end, formattingFn }: { end: number; formattingFn?: (n: number) => string }) =>
    formattingFn ? formattingFn(end) : String(end),
}));

const mockEntries: LeaderboardEntry[] = [
  {
    gamesAsTaker: 5,
    gamesPlayed: 20,
    playerColor: null,
    playerId: 1,
    playerName: "Alice",
    totalScore: 500,
    winRate: 60.0,
    wins: 3,
  },
  {
    gamesAsTaker: 3,
    gamesPlayed: 20,
    playerColor: null,
    playerId: 2,
    playerName: "Bob",
    totalScore: 200,
    winRate: 33.3,
    wins: 1,
  },
];

function generateEntries(count: number): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    gamesAsTaker: 5,
    gamesPlayed: 20,
    playerColor: null,
    playerId: i + 1,
    playerName: `Player ${i + 1}`,
    totalScore: 1000 - i * 10,
    winRate: 50,
    wins: 10,
  }));
}

describe("Leaderboard", () => {
  it("renders player names and scores", () => {
    renderWithProviders(
      <Leaderboard entries={mockEntries} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("+500")).toBeInTheDocument();
    expect(screen.getByText("+200")).toBeInTheDocument();
  });

  it("renders rank numbers", () => {
    renderWithProviders(
      <Leaderboard entries={mockEntries} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders games played and win rate", () => {
    renderWithProviders(
      <Leaderboard entries={mockEntries} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("20 donnes · 60% victoires")).toBeInTheDocument();
    expect(screen.getByText("20 donnes · 33.3% victoires")).toBeInTheDocument();
  });

  it("calls onPlayerClick when a row is tapped", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithProviders(
      <Leaderboard entries={mockEntries} onPlayerClick={onClick} />,
    );

    await user.click(screen.getByText("Alice"));

    expect(onClick).toHaveBeenCalledWith(1);
  });

  it("renders empty message when no entries", () => {
    renderWithProviders(
      <Leaderboard entries={[]} onPlayerClick={() => {}} />,
    );

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  describe("load more", () => {
    it("shows only 10 entries initially", () => {
      const entries = generateEntries(15);
      renderWithProviders(
        <Leaderboard entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.getByText("Player 10")).toBeInTheDocument();
      expect(screen.queryByText("Player 11")).not.toBeInTheDocument();
    });

    it("does not show load more button when 10 or fewer entries", () => {
      const entries = generateEntries(10);
      renderWithProviders(
        <Leaderboard entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.queryByRole("button", { name: /voir plus/i })).not.toBeInTheDocument();
    });

    it("shows load more button with remaining count", () => {
      const entries = generateEntries(11);
      renderWithProviders(
        <Leaderboard entries={entries} onPlayerClick={() => {}} />,
      );

      expect(screen.getByRole("button", { name: /voir plus/i })).toHaveTextContent("Voir plus (1)");
    });

    it("reveals next batch of entries on click", async () => {
      const user = userEvent.setup();
      const entries = generateEntries(25);
      renderWithProviders(
        <Leaderboard entries={entries} onPlayerClick={() => {}} />,
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
        <Leaderboard entries={entries} onPlayerClick={() => {}} />,
      );

      await user.click(screen.getByRole("button", { name: /voir plus/i }));

      expect(screen.getByText("Player 15")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /voir plus/i })).not.toBeInTheDocument();
    });
  });
});
