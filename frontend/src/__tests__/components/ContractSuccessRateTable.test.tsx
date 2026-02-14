import { screen } from "@testing-library/react";
import ContractSuccessRateTable from "../../components/ContractSuccessRateTable";
import type { ContractSuccessRatePlayer } from "../../types/api";
import { Contract } from "../../types/enums";
import { renderWithProviders } from "../test-utils";

const mockData: ContractSuccessRatePlayer[] = [
  {
    color: "#ef4444",
    contracts: [
      { contract: Contract.Petite, count: 8, winRate: 75, wins: 6 },
      { contract: Contract.Garde, count: 4, winRate: 50, wins: 2 },
    ],
    id: 1,
    name: "Alice",
  },
  {
    color: null,
    contracts: [
      { contract: Contract.Garde, count: 3, winRate: 100, wins: 3 },
      { contract: Contract.GardeSans, count: 1, winRate: 0, wins: 0 },
    ],
    id: 2,
    name: "Bob",
  },
];

describe("ContractSuccessRateTable", () => {
  it("renders player names", () => {
    renderWithProviders(<ContractSuccessRateTable data={mockData} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders contract column headers", () => {
    renderWithProviders(<ContractSuccessRateTable data={mockData} />);

    expect(screen.getByText("Petite")).toBeInTheDocument();
    expect(screen.getByText("Garde")).toBeInTheDocument();
    expect(screen.getByText("G. Sans")).toBeInTheDocument();
    expect(screen.getByText("G. Contre")).toBeInTheDocument();
  });

  it("renders win rate and count for existing contracts", () => {
    renderWithProviders(<ContractSuccessRateTable data={mockData} />);

    // Alice: Petite 75% (8)
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("(8)")).toBeInTheDocument();

    // Bob: Garde 100% (3)
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("renders dash for contracts not played", () => {
    renderWithProviders(<ContractSuccessRateTable data={mockData} />);

    // Alice has no GardeSans/GardeContre, Bob has no Petite/GardeContre
    const dashes = screen.getAllByText("–");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("renders empty message when no data", () => {
    renderWithProviders(<ContractSuccessRateTable data={[]} />);

    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });
});
