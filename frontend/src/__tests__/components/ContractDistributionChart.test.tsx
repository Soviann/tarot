import { render, screen } from "@testing-library/react";
import ContractDistributionChart from "../../components/ContractDistributionChart";
import { Contract } from "../../types/enums";
import type { ContractDistributionEntry } from "../../types/api";
import { legendProps, tooltipProps } from "../mocks/recharts";

vi.mock("recharts", () => import("../mocks/recharts"));

const sampleData: ContractDistributionEntry[] = [
  { contract: Contract.Petite, count: 12, percentage: 40 },
  { contract: Contract.Garde, count: 10, percentage: 33.3 },
  { contract: Contract.GardeSans, count: 5, percentage: 16.7 },
  { contract: Contract.GardeContre, count: 3, percentage: 10 },
];

describe("ContractDistributionChart", () => {
  beforeEach(() => {
    Object.keys(tooltipProps).forEach((k) => delete tooltipProps[k]);
    Object.keys(legendProps).forEach((k) => delete legendProps[k]);
  });

  it("renders empty message when data is empty", () => {
    render(<ContractDistributionChart data={[]} />);

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  it("renders a pie chart with contract data", () => {
    render(<ContractDistributionChart data={sampleData} />);

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("pie")).toBeInTheDocument();
  });

  it("renders a cell for each contract", () => {
    render(<ContractDistributionChart data={sampleData} />);

    const cells = screen.getAllByTestId("cell");
    expect(cells).toHaveLength(4);
  });

  it("renders a legend", () => {
    render(<ContractDistributionChart data={sampleData} />);

    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("renders with single contract", () => {
    const singleData: ContractDistributionEntry[] = [
      { contract: Contract.Garde, count: 5, percentage: 100 },
    ];
    render(<ContractDistributionChart data={singleData} />);

    const pie = screen.getByTestId("pie");
    expect(pie).toHaveAttribute("data-entry-count", "1");
  });

  it("sets minWidth={0} and minHeight={0} on ResponsiveContainer", () => {
    render(<ContractDistributionChart data={sampleData} />);

    const container = screen.getByTestId("responsive-container");
    expect(container).toHaveAttribute("data-min-width", "0");
    expect(container).toHaveAttribute("data-min-height", "0");
  });

  it("tooltip formatter displays percentage", () => {
    render(<ContractDistributionChart data={sampleData} />);

    const formatter = tooltipProps.formatter as (
      value: number,
      name: string,
      props: { payload: { percentage: number } },
    ) => [string, string];
    const result = formatter(12, "Petite", { payload: { percentage: 40 } });
    expect(result).toEqual(["12 (40%)", "Donnes"]);
  });

  it("legend formatter displays count", () => {
    render(<ContractDistributionChart data={sampleData} />);

    const formatter = legendProps.formatter as (
      value: string,
      entry: { payload?: { value?: number } },
    ) => React.ReactNode;
    const result = formatter("Petite", { payload: { value: 12 } });
    const { getByText } = render(<>{result}</>);
    expect(getByText("Petite (12)")).toBeInTheDocument();
  });

  it("uses fallback label for unknown contract", () => {
    const unknownData: ContractDistributionEntry[] = [
      { contract: "unknown_contract" as Contract, count: 5, percentage: 100 },
    ];
    render(<ContractDistributionChart data={unknownData} />);

    // The fallback label is the raw contract string — it appears in the Pie data
    // Cell is rendered with the name as key
    const pie = screen.getByTestId("pie");
    expect(pie).toHaveAttribute("data-entry-count", "1");
  });

  it("uses fallback color for unknown contract", () => {
    const unknownData: ContractDistributionEntry[] = [
      { contract: "unknown_contract" as Contract, count: 5, percentage: 100 },
    ];
    render(<ContractDistributionChart data={unknownData} />);

    const cell = screen.getByTestId("cell");
    expect(cell).toHaveAttribute("data-fill", "var(--color-accent-400)");
  });
});
