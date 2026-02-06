import { fireEvent, screen } from "@testing-library/react";
import Stepper from "../../../components/ui/Stepper";
import { renderWithProviders } from "../../test-utils";

describe("Stepper", () => {
  it("displays the current value and label", () => {
    renderWithProviders(
      <Stepper label="Points" max={10} min={0} onChange={() => {}} value={5} />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
  });

  it("calls onChange with incremented value on + click", () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Stepper label="Points" max={10} min={0} onChange={handleChange} value={5} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /augmenter/i }));
    expect(handleChange).toHaveBeenCalledWith(6);
  });

  it("calls onChange with decremented value on - click", () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Stepper label="Points" max={10} min={0} onChange={handleChange} value={5} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /diminuer/i }));
    expect(handleChange).toHaveBeenCalledWith(4);
  });

  it("disables - button at min value", () => {
    renderWithProviders(
      <Stepper label="Points" max={10} min={0} onChange={() => {}} value={0} />,
    );

    expect(screen.getByRole("button", { name: /diminuer/i })).toBeDisabled();
  });

  it("disables + button at max value", () => {
    renderWithProviders(
      <Stepper label="Points" max={10} min={0} onChange={() => {}} value={10} />,
    );

    expect(screen.getByRole("button", { name: /augmenter/i })).toBeDisabled();
  });

  it("does not call onChange when clicking disabled - button", () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Stepper label="Points" max={10} min={0} onChange={handleChange} value={0} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /diminuer/i }));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
