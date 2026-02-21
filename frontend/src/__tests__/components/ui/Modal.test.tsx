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

  it("has accessible title linked via aria-labelledby", () => {
    renderWithProviders(
      <Modal onClose={() => {}} open title="Titre">
        <p>Contenu</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const heading = document.getElementById(labelledBy!);
    expect(heading?.textContent).toBe("Titre");
  });
});
