import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chelem, Contract, Poignee, Side } from "../../types/enums";
import type { Game, GamePlayer } from "../../types/api";
import ScoreEvolutionChart, { computeScoreEvolution } from "../../components/ScoreEvolutionChart";
import { PLAYER_PALETTE } from "../../components/ui/PlayerAvatar";
import { resetCapturedProps, tooltipProps } from "../mocks/recharts";

vi.mock("recharts", () => import("../mocks/recharts"));

const players: GamePlayer[] = [
  { color: "#ef4444", id: 1, name: "Alice" },
  { color: null, id: 2, name: "Bob" },
  { color: null, id: 3, name: "Charlie" },
  { color: null, id: 4, name: "Diana" },
  { color: null, id: 5, name: "Eve" },
];

function makeGame(position: number, scores: Record<string, number>): Game {
  return {
    chelem: Chelem.None,
    completedAt: "2026-02-07T12:05:00+00:00",
    contract: Contract.Petite,
    createdAt: "2026-02-07T12:00:00+00:00",
    dealer: null,
    id: position,
    oudlers: 2,
    partner: players[1],
    petitAuBout: Side.None,
    poignee: Poignee.None,
    poigneeOwner: Side.None,
    points: 45,
    position,
    scoreEntries: Object.entries(scores).map(([name, score]) => ({
      id: position * 10 + players.findIndex((p) => p.name === name),
      player: players.find((p) => p.name === name)!,
      score,
    })),
    status: "completed",
    taker: players[0],
  };
}

const twoGames = [
  makeGame(1, { Alice: 58, Bob: 29, Charlie: -29, Diana: -29, Eve: -29 }),
  makeGame(2, { Alice: -68, Bob: -68, Charlie: 136, Diana: 68, Eve: -68 }),
];

describe("computeScoreEvolution", () => {
  it("computes cumulative scores across games", () => {
    const result = computeScoreEvolution(twoGames, players);

    expect(result).toHaveLength(2);
    // Game 1
    expect(result[0]).toEqual({
      Alice: 58,
      Bob: 29,
      Charlie: -29,
      Diana: -29,
      Eve: -29,
      position: 1,
    });
    // Game 2 (cumulative)
    expect(result[1]).toEqual({
      Alice: 58 + -68,
      Bob: 29 + -68,
      Charlie: -29 + 136,
      Diana: -29 + 68,
      Eve: -29 + -68,
      position: 2,
    });
  });

  it("returns empty array for empty games", () => {
    expect(computeScoreEvolution([], players)).toEqual([]);
  });

  it("filters out in-progress games", () => {
    const inProgressGame: Game = { ...makeGame(3, {}), scoreEntries: [], status: "in_progress" };
    const result = computeScoreEvolution([...twoGames, inProgressGame], players);
    expect(result).toHaveLength(2);
  });

  it("sorts games by position", () => {
    const game2 = makeGame(2, { Alice: -10, Bob: -10, Charlie: 10, Diana: 10, Eve: 0 });
    const game1 = makeGame(1, { Alice: 50, Bob: 20, Charlie: -20, Diana: -20, Eve: -30 });

    // Pass in reverse order
    const result = computeScoreEvolution([game2, game1], players);

    expect(result[0].position).toBe(1);
    expect(result[1].position).toBe(2);
    // Cumulative: game1 Alice=50, game2 Alice=50+(-10)=40
    expect(result[1].Alice).toBe(40);
  });
});

describe("ScoreEvolutionChart", () => {
  beforeEach(() => {
    resetCapturedProps();
  });

  it("renders nothing when fewer than 2 games", () => {
    const { container } = render(
      <ScoreEvolutionChart games={[twoGames[0]]} players={players} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("sets minWidth={0} and minHeight={0} on ResponsiveContainer", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-min-width", "0");
    expect(container).toHaveAttribute("data-min-height", "0");
  });

  it("renders chart with all player lines by default", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-Alice")).toBeInTheDocument();
    expect(screen.getByTestId("line-Bob")).toBeInTheDocument();
  });

  it("uses hex colors for line strokes, not CSS variables", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    for (const player of players) {
      const line = screen.getByTestId(`line-${player.name}`);
      const stroke = line.getAttribute("data-stroke");
      expect(stroke).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("renders player filter chips", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("toggles player visibility when chip is clicked", async () => {
    const user = userEvent.setup();
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    // Click Alice to hide her
    await user.click(screen.getByText("Alice"));

    // Alice line should be hidden
    expect(screen.queryByTestId("line-Alice")).not.toBeInTheDocument();
    expect(screen.getByTestId("line-Bob")).toBeInTheDocument();

    // Click again to show
    await user.click(screen.getByText("Alice"));
    expect(screen.getByTestId("line-Alice")).toBeInTheDocument();
  });

  it("uses player custom color for chip", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    const aliceChip = screen.getByText("Alice");
    // Alice has custom color #ef4444
    expect(aliceChip).toHaveStyle({ backgroundColor: "#ef4444" });
  });

  it("renders only the last 10 data points when more than 10 games", () => {
    const games = Array.from({ length: 12 }, (_, i) =>
      makeGame(i + 1, { Alice: 10, Bob: -5, Charlie: -5, Diana: 5, Eve: -5 }),
    );

    render(<ScoreEvolutionChart games={games} players={players} />);

    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-point-count", "10");
  });

  it("renders all 10 data points when exactly 10 games", () => {
    const games = Array.from({ length: 10 }, (_, i) =>
      makeGame(i + 1, { Alice: 10, Bob: -5, Charlie: -5, Diana: 5, Eve: -5 }),
    );

    render(<ScoreEvolutionChart games={games} players={players} />);

    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-point-count", "10");
  });

  it("renders all data points when 10 or fewer games", () => {
    const games = Array.from({ length: 8 }, (_, i) =>
      makeGame(i + 1, { Alice: 10, Bob: -5, Charlie: -5, Diana: 5, Eve: -5 }),
    );

    render(<ScoreEvolutionChart games={games} players={players} />);

    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-point-count", "8");
  });

  it("hidden chip has opacity-40 class", async () => {
    const user = userEvent.setup();
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    const aliceChip = screen.getByText("Alice");
    await user.click(aliceChip);

    expect(aliceChip).toHaveClass("opacity-40");
  });

  it("hidden chip has no background color", async () => {
    const user = userEvent.setup();
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    const aliceChip = screen.getByText("Alice");
    await user.click(aliceChip);

    expect(aliceChip.style.backgroundColor).toBe("");
  });

  it("uses PLAYER_PALETTE fallback for player without custom color", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    // Bob has id=2, color=null → fallback is PLAYER_PALETTE[2 % 10] = "#e9c46a"
    const bobChip = screen.getByText("Bob");
    expect(bobChip).toHaveStyle({ backgroundColor: PLAYER_PALETTE[2 % PLAYER_PALETTE.length] });
  });

  it("tooltip labelFormatter returns 'Donne <label>'", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    const labelFormatter = tooltipProps.labelFormatter as (label: number) => string;
    expect(labelFormatter(5)).toBe("Donne 5");
  });
});
