import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chelem, Contract, Poignee, Side } from "../../types/enums";
import type { Game, GamePlayer } from "../../types/api";
import ScoreEvolutionChart, { computeScoreEvolution } from "../../components/ScoreEvolutionChart";

// Mock Recharts to avoid jsdom rendering issues
vi.mock("recharts", () => ({
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid={`line-${dataKey}`} />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
}));

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
  it("renders nothing when fewer than 2 games", () => {
    const { container } = render(
      <ScoreEvolutionChart games={[twoGames[0]]} players={players} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders chart with all player lines by default", () => {
    render(<ScoreEvolutionChart games={twoGames} players={players} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-Alice")).toBeInTheDocument();
    expect(screen.getByTestId("line-Bob")).toBeInTheDocument();
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
});
