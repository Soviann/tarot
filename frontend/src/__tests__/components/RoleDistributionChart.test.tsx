import { render, screen } from "@testing-library/react";
import RoleDistributionChart from "../../components/RoleDistributionChart";
import { legendProps, tooltipProps } from "../mocks/recharts";

vi.mock("recharts", () => import("../mocks/recharts"));

describe("RoleDistributionChart", () => {
  beforeEach(() => {
    Object.keys(tooltipProps).forEach((k) => delete tooltipProps[k]);
    Object.keys(legendProps).forEach((k) => delete legendProps[k]);
  });

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

  it("sets minWidth={0} and minHeight={0} on ResponsiveContainer", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={5}
        gamesAsTaker={8}
      />,
    );

    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-min-width", "0");
    expect(container).toHaveAttribute("data-min-height", "0");
  });

  it("tooltip formatter displays percentage", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={5}
        gamesAsTaker={8}
      />,
    );

    const formatter = tooltipProps.formatter as (value: number) => [string, string];
    // total = 8 + 5 + 10 = 23, percentage = Math.round(8/23*1000)/10 = 34.8
    const result = formatter(8);
    expect(result).toEqual(["8 (34.8%)", "Donnes"]);
  });

  it("legend formatter displays count", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={10}
        gamesAsPartner={5}
        gamesAsTaker={8}
      />,
    );

    const formatter = legendProps.formatter as (
      value: string,
      entry: { payload?: { value?: number } },
    ) => React.ReactNode;
    const result = formatter("Preneur", { payload: { value: 8 } });
    const { getByText } = render(<>{result}</>);
    expect(getByText("Preneur (8)")).toBeInTheDocument();
  });

  it("percentage calculation is correct for small totals", () => {
    render(
      <RoleDistributionChart
        gamesAsDefender={1}
        gamesAsPartner={0}
        gamesAsTaker={1}
      />,
    );

    const formatter = tooltipProps.formatter as (value: number) => [string, string];
    // total = 1 + 0 + 1 = 2, percentage = Math.round(1/2*1000)/10 = 50
    const result = formatter(1);
    expect(result).toEqual(["1 (50%)", "Donnes"]);
  });
});
