import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Leaderboard from "../../components/Leaderboard";
import type { LeaderboardEntry } from "../../types/api";
import { renderWithProviders } from "../test-utils";

const mockEntries: LeaderboardEntry[] = [
  {
    gamesAsTaker: 5,
    gamesPlayed: 20,
    playerId: 1,
    playerName: "Alice",
    totalScore: 500,
    winRate: 60.0,
    wins: 3,
  },
  {
    gamesAsTaker: 3,
    gamesPlayed: 20,
    playerId: 2,
    playerName: "Bob",
    totalScore: 200,
    winRate: 33.3,
    wins: 1,
  },
];

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
});
