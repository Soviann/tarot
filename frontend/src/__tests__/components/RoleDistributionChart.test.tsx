import { render, screen } from "@testing-library/react";

// Mock Recharts to avoid jsdom rendering issues
vi.mock("recharts", () => ({
  Cell: ({ fill }: { fill: string }) => <div data-fill={fill} data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  Pie: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-entry-count={data.length} data-testid="pie">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
}));

import RoleDistributionChart from "../../components/RoleDistributionChart";

describe("RoleDistributionChart", () => {
  it("renders empty message when all roles are zero", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={0}
        gamesAsPartner={0}
        gamesAsTaker={0}
      />,
    );

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  it("renders a pie chart with role data", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={5}
        gamesAsTaker={8}
      />,
    );

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie")).toBeInTheDocument();
  });

  it("renders 3 cells for all 3 roles when all have data", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={5}
        gamesAsTaker={8}
      />,
    );

    const cells = screen.getAllByTestId("cell");
    expect(cells).toHaveLength(3);
  });

  it("renders only cells for roles with data", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={0}
        gamesAsTaker={8}
      />,
    );

    const pie = screen.getByTestId("pie");
    expect(pie).toHaveAttribute("data-entry-count", "2");
  });

  it("renders a legend", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={5}
        gamesAsTaker={8}
      />,
    );

    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });
});
