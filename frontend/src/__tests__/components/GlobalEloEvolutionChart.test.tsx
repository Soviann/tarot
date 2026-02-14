import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EloEvolutionPlayer } from "../../types/api";
import GlobalEloEvolutionChart, {
  buildChartData,
} from "../../components/GlobalEloEvolutionChart";

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

const sampleData: EloEvolutionPlayer[] = [
  {
    history: [
      { date: "2026-01-15T12:00:00+00:00", gameId: 1, ratingAfter: 1520 },
      { date: "2026-01-15T13:00:00+00:00", gameId: 2, ratingAfter: 1510 },
    ],
    playerColor: "#ef4444",
    playerId: 1,
    playerName: "Alice",
  },
  {
    history: [
      { date: "2026-01-15T12:00:00+00:00", gameId: 1, ratingAfter: 1480 },
      { date: "2026-01-15T13:00:00+00:00", gameId: 2, ratingAfter: 1490 },
    ],
    playerColor: null,
    playerId: 2,
    playerName: "Bob",
  },
];

describe("buildChartData", () => {
  it("transforms per-player data into flat chart format", () => {
    const result = buildChartData(sampleData);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      Alice: 1520,
      Bob: 1480,
      gameIndex: 1,
    });
    expect(result[1]).toEqual({
      Alice: 1510,
      Bob: 1490,
      gameIndex: 2,
    });
  });

  it("handles players with different history lengths using null", () => {
    const data: EloEvolutionPlayer[] = [
      {
        history: [
          { date: "2026-01-15T12:00:00+00:00", gameId: 1, ratingAfter: 1520 },
          { date: "2026-01-15T13:00:00+00:00", gameId: 2, ratingAfter: 1530 },
          { date: "2026-01-15T14:00:00+00:00", gameId: 3, ratingAfter: 1540 },
        ],
        playerColor: null,
        playerId: 1,
        playerName: "Alice",
      },
      {
        history: [
          { date: "2026-01-15T12:00:00+00:00", gameId: 1, ratingAfter: 1480 },
        ],
        playerColor: null,
        playerId: 2,
        playerName: "Bob",
      },
    ];

    const result = buildChartData(data);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ Alice: 1520, Bob: 1480, gameIndex: 1 });
    expect(result[1]).toEqual({ Alice: 1530, Bob: null, gameIndex: 2 });
    expect(result[2]).toEqual({ Alice: 1540, Bob: null, gameIndex: 3 });
  });

  it("returns empty array for empty input", () => {
    expect(buildChartData([])).toEqual([]);
  });
});

describe("GlobalEloEvolutionChart", () => {
  it("renders chart with player lines", () => {
    render(<GlobalEloEvolutionChart data={sampleData} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-Alice")).toBeInTheDocument();
    expect(screen.getByTestId("line-Bob")).toBeInTheDocument();
  });

  it("renders nothing when data is empty", () => {
    const { container } = render(<GlobalEloEvolutionChart data={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("renders player filter chips", () => {
    render(<GlobalEloEvolutionChart data={sampleData} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("toggles player visibility when chip is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalEloEvolutionChart data={sampleData} />);

    // Click Alice to hide her
    await user.click(screen.getByText("Alice"));

    // Alice line should be hidden
    expect(screen.queryByTestId("line-Alice")).not.toBeInTheDocument();
    expect(screen.getByTestId("line-Bob")).toBeInTheDocument();

    // Click again to show
    await user.click(screen.getByText("Alice"));
    expect(screen.getByTestId("line-Alice")).toBeInTheDocument();
  });
});
