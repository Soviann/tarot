import { render, screen } from "@testing-library/react";
import ContractDistributionChart from "../../components/ContractDistributionChart";
import { Contract } from "../../types/enums";
import type { ContractDistributionEntry } from "../../types/api";

vi.mock("recharts", () => import("../mocks/recharts"));

const sampleData: ContractDistributionEntry[] = [
  { contract: Contract.Petite, count: 12, percentage: 40 },
  { contract: Contract.Garde, count: 10, percentage: 33.3 },
  { contract: Contract.GardeSans, count: 5, percentage: 16.7 },
  { contract: Contract.GardeContre, count: 3, percentage: 10 },
];

describe("ContractDistributionChart", () => {
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
});
