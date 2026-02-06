import { screen } from "@testing-library/react";
import ScoreDisplay from "../../../components/ui/ScoreDisplay";
import { renderWithProviders } from "../../test-utils";

describe("ScoreDisplay", () => {
  it("shows positive value with green color", () => {
    renderWithProviders(<ScoreDisplay animated={false} value={42} />);

    const el = screen.getByText("+42");
    expect(el.className).toMatch(/text-score-positive/);
  });

  it("shows negative value with red color", () => {
    renderWithProviders(<ScoreDisplay animated={false} value={-15} />);

    const el = screen.getByText("-15");
    expect(el.className).toMatch(/text-score-negative/);
  });

  it("shows zero with muted color", () => {
    renderWithProviders(<ScoreDisplay animated={false} value={0} />);

    const el = screen.getByText("0");
    expect(el.className).toMatch(/text-text-muted/);
  });

  it("uses tabular-nums for alignment", () => {
    renderWithProviders(<ScoreDisplay animated={false} value={100} />);

    const el = screen.getByText("+100");
    expect(el.className).toMatch(/tabular-nums/);
  });

  it("formats the value with sign prefix", () => {
    renderWithProviders(<ScoreDisplay animated={false} value={100} />);
    expect(screen.getByText("+100")).toBeInTheDocument();

    renderWithProviders(<ScoreDisplay animated={false} value={-50} />);
    expect(screen.getByText("-50")).toBeInTheDocument();
  });
});
