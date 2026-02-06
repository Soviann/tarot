import { fireEvent, screen } from "@testing-library/react";
import FAB from "../../../components/ui/FAB";
import { renderWithProviders } from "../../test-utils";

describe("FAB", () => {
  it("renders the icon", () => {
    renderWithProviders(
      <FAB aria-label="Ajouter" icon={<svg data-testid="icon" />} onClick={() => {}} />,
    );

    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <FAB aria-label="Ajouter" icon={<span>+</span>} onClick={handleClick} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("has the correct aria-label", () => {
    renderWithProviders(
      <FAB aria-label="Nouvelle donne" icon={<span>+</span>} onClick={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "Nouvelle donne" })).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <FAB aria-label="Ajouter" disabled icon={<span>+</span>} onClick={handleClick} />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
