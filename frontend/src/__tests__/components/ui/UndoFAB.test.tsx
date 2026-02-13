import { act, fireEvent, screen } from "@testing-library/react";
import UndoFAB from "../../../components/ui/UndoFAB";
import { renderWithProviders } from "../../test-utils";

describe("UndoFAB", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with undo aria-label", () => {
    renderWithProviders(
      <UndoFAB onDismiss={() => {}} onUndo={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "Annuler la donne" })).toBeInTheDocument();
  });

  it("calls onUndo when clicked", () => {
    const handleUndo = vi.fn();
    renderWithProviders(
      <UndoFAB onDismiss={() => {}} onUndo={handleUndo} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Annuler la donne" }));
    expect(handleUndo).toHaveBeenCalledOnce();
  });

  it("calls onDismiss after 5 seconds", () => {
    const handleDismiss = vi.fn();
    renderWithProviders(
      <UndoFAB onDismiss={handleDismiss} onUndo={() => {}} />,
    );

    expect(handleDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(5000));
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it("does not call onDismiss if clicked before timeout", () => {
    const handleDismiss = vi.fn();
    const handleUndo = vi.fn();
    renderWithProviders(
      <UndoFAB onDismiss={handleDismiss} onUndo={handleUndo} />,
    );

    act(() => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole("button", { name: "Annuler la donne" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(handleDismiss).not.toHaveBeenCalled();
  });

  it("renders the SVG countdown ring", () => {
    const { container } = renderWithProviders(
      <UndoFAB onDismiss={() => {}} onUndo={() => {}} />,
    );

    const circle = container.querySelector("circle");
    expect(circle).toBeInTheDocument();
  });
});
