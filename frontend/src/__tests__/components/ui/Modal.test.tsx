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

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    renderWithProviders(
      <Modal onClose={handleClose} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    // Click the backdrop (the outer overlay div)
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
    // The portal renders directly on body, not inside #root
    expect(dialog.closest("#root")).toBeNull();
  });

  it("has aria-modal attribute", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });
});
