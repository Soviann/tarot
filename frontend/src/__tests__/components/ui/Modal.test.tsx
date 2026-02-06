import { fireEvent, screen } from "@testing-library/react";
import Modal from "../../../components/ui/Modal";
import { renderWithProviders } from "../../test-utils";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open={false} title="Test">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Titre")).toBeInTheDocument();
    expect(screen.getByText("Contenu")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <Modal onClose={handleClose} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: /fermer/i }));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <Modal onClose={handleClose} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <Modal onClose={handleClose} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.parentElement!);
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("does not close when clicking inside the modal content", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <Modal onClose={handleClose} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText("Contenu"));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("renders in a portal (outside the component tree root)", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.closest("#root")).toBeNull();
  });

  it("has aria-modal and aria-labelledby attributes", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const heading = document.getElementById(labelledBy!);
    expect(heading?.textContent).toBe("Titre");
  });

  it("traps focus: Tab wraps from last to first focusable element", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <button type="button">Action 1</button>
        <button type="button">Action 2</button>
      </Modal>,
    );

    const action2 = screen.getByText("Action 2");
    action2.focus();

    fireEvent.keyDown(document, { key: "Tab" });

    // After Tab from the last button, focus wraps to the first focusable (close button)
    const closeBtn = screen.getByRole("button", { name: /fermer/i });
    expect(document.activeElement).toBe(closeBtn);
  });

  it("traps focus: Shift+Tab wraps from first to last focusable element", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <button type="button">Action 1</button>
        <button type="button">Action 2</button>
      </Modal>,
    );

    const closeBtn = screen.getByRole("button", { name: /fermer/i });
    closeBtn.focus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    const action2 = screen.getByText("Action 2");
    expect(document.activeElement).toBe(action2);
  });
});
