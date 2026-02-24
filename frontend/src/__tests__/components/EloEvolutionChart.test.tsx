import { render, screen } from "@testing-library/react";
import EloEvolutionChart from "../../components/EloEvolutionChart";
import type { EloHistoryEntry } from "../../types/api";

vi.mock("recharts", () => import("../mocks/recharts"));

const sampleData: EloHistoryEntry[] = [
  { date: "2026-02-10T12:00:00+00:00", gameId: 1, ratingAfter: 1520, ratingChange: 20 },
  { date: "2026-02-10T13:00:00+00:00", gameId: 2, ratingAfter: 1510, ratingChange: -10 },
  { date: "2026-02-10T14:00:00+00:00", gameId: 3, ratingAfter: 1535, ratingChange: 25 },
];

describe("EloEvolutionChart", () => {
  it("renders empty message when data is empty", () => {
    render(<EloEvolutionChart data={[]} />);

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  it("renders a line chart with data", () => {
    render(<EloEvolutionChart data={sampleData} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("line-rating")).toBeInTheDocument();
  });

  it("renders all data points", () => {
    render(<EloEvolutionChart data={sampleData} />);

    const chart = screen.getByTestId("line-chart");
    expect(chart).toHaveAttribute("data-point-count", "3");
  });

  it("sets minWidth={0} and minHeight={0} on ResponsiveContainer", () => {
    render(<EloEvolutionChart data={sampleData} />);

    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-min-width", "0");
    expect(container).toHaveAttribute("data-min-height", "0");
  });

  it("renders reference line at y=1500", () => {
    render(<EloEvolutionChart data={sampleData} />);

    expect(screen.getByTestId("reference-line")).toBeInTheDocument();
  });
});
