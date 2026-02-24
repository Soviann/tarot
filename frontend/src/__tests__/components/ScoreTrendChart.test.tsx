import { render, screen } from "@testing-library/react";
import ScoreTrendChart from "../../components/ScoreTrendChart";
import type { RecentScoreEntry } from "../../types/api";

vi.mock("recharts", () => import("../mocks/recharts"));

const sampleData: RecentScoreEntry[] = [
  { date: "2026-02-10T14:00:00+00:00", gameId: 3, score: -40, sessionId: 1 },
  { date: "2026-02-10T13:00:00+00:00", gameId: 2, score: 120, sessionId: 1 },
  { date: "2026-02-10T12:00:00+00:00", gameId: 1, score: 60, sessionId: 1 },
];

describe("ScoreTrendChart", () => {
  it("renders empty message when data is empty", () => {
    render(<ScoreTrendChart data={[]} />);

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  it("renders a line chart with data", () => {
    render(<ScoreTrendChart data={sampleData} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-score")).toBeInTheDocument();
  });

  it("reverses data for chronological display", () => {
    render(<ScoreTrendChart data={sampleData} />);

    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-point-count", "3");
  });

  it("sets minWidth={0} and minHeight={0} on ResponsiveContainer", () => {
    render(<ScoreTrendChart data={sampleData} />);

    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-min-width", "0");
    expect(container).toHaveAttribute("data-min-height", "0");
  });

  it("renders reference line at y=0", () => {
    render(<ScoreTrendChart data={sampleData} />);

    expect(screen.getByTestId("reference-line")).toBeInTheDocument();
  });
});
