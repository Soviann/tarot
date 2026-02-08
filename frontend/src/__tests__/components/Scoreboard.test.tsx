import { fireEvent, screen } from "@testing-library/react";
import Scoreboard from "../../components/Scoreboard";
import { renderWithProviders } from "../test-utils";

const players = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Diana" },
  { id: 5, name: "Eve" },
];

describe("Scoreboard", () => {
  it("renders all player names", () => {
    renderWithProviders(
      <Scoreboard cumulativeScores={[]} players={players} />,
    );

    for (const player of players) {
      expect(screen.getByText(player.name)).toBeInTheDocument();
    }
  });

  it("renders player avatars", () => {
    renderWithProviders(
      <Scoreboard cumulativeScores={[]} players={players} />,
    );

    const avatars = screen.getAllByRole("img");
    expect(avatars).toHaveLength(5);
  });

  it("renders cumulative scores with correct colors", () => {
    const cumulativeScores = [
      { playerId: 1, playerName: "Alice", score: 120 },
      { playerId: 2, playerName: "Bob", score: -30 },
      { playerId: 3, playerName: "Charlie", score: 0 },
    ];

    renderWithProviders(
      <Scoreboard cumulativeScores={cumulativeScores} players={players} />,
    );

    expect(screen.getByText("+120")).toBeInTheDocument();
    expect(screen.getByText("-30")).toBeInTheDocument();
    // Players with 0 or no score should show 0
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(3); // Charlie (0), Diana (no entry), Eve (no entry)
  });

  it("shows 0 for players with no score entry", () => {
    renderWithProviders(
      <Scoreboard cumulativeScores={[]} players={players} />,
    );

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(5);
  });

  it("renders dealer badge as clickable button when onDealerChange provided", () => {
    const onDealerChange = vi.fn();

    renderWithProviders(
      <Scoreboard
        cumulativeScores={[]}
        currentDealerId={1}
        onDealerChange={onDealerChange}
        players={players}
      />,
    );

    const dealerButton = screen.getByRole("button", { name: "Changer le donneur" });
    expect(dealerButton).toBeInTheDocument();
    fireEvent.click(dealerButton);
    expect(onDealerChange).toHaveBeenCalledTimes(1);
  });

  it("renders dealer badge as non-interactive span when no onDealerChange", () => {
    renderWithProviders(
      <Scoreboard
        cumulativeScores={[]}
        currentDealerId={1}
        players={players}
      />,
    );

    expect(screen.queryByRole("button", { name: "Changer le donneur" })).not.toBeInTheDocument();
    // The dealer badge should still be visible (as a span with title)
    expect(screen.getByTitle("Donneur")).toBeInTheDocument();
  });
});
