import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddStarModal from "../../components/AddStarModal";
import { renderWithProviders } from "../test-utils";

describe("AddStarModal", () => {
  const defaultProps = {
    isError: false,
    isPending: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    open: true,
    playerName: "Alice",
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders confirmation text with player name", () => {
    renderWithProviders(<AddStarModal {...defaultProps} />);

    expect(screen.getByText("Confirmer l'étoile")).toBeInTheDocument();
    expect(screen.getByText(/Attribuer une étoile à Alice/)).toBeInTheDocument();
  });

  it("calls onClose when Annuler is clicked", async () => {
    renderWithProviders(<AddStarModal {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm when Confirmer is clicked", async () => {
    renderWithProviders(<AddStarModal {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it("disables Confirmer button when isPending", () => {
    renderWithProviders(<AddStarModal {...defaultProps} isPending={true} />);

    expect(screen.getByRole("button", { name: "Confirmer" })).toBeDisabled();
  });

  it("displays error message when isError", () => {
    renderWithProviders(
      <AddStarModal {...defaultProps} errorMessage="Erreur serveur" isError={true} />,
    );

    expect(screen.getByText("Erreur serveur")).toBeInTheDocument();
  });

  it("displays default error message when isError without errorMessage", () => {
    renderWithProviders(<AddStarModal {...defaultProps} isError={true} />);

    expect(screen.getByText("Erreur inconnue")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(<AddStarModal {...defaultProps} open={false} />);

    expect(screen.queryByText("Confirmer l'étoile")).not.toBeInTheDocument();
  });
});
