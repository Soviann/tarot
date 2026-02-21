import { render, screen } from "@testing-library/react";
import RoleDistributionChart from "../../components/RoleDistributionChart";

vi.mock("recharts", () => import("../mocks/recharts"));

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
