import { fireEvent, screen, waitFor } from "@testing-library/react";
import ChangeDealerModal from "../../components/ChangeDealerModal";
import { renderWithProviders } from "../test-utils";

const players = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Diana" },
  { id: 5, name: "Eve" },
];

describe("ChangeDealerModal", () => {
  it("renders all players as selectable options", () => {
    renderWithProviders(
      <ChangeDealerModal
        currentDealerId={1}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    expect(screen.getByText("Choisir le donneur")).toBeInTheDocument();
    for (const player of players) {
      expect(screen.getByLabelText(`Sélectionner ${player.name}`)).toBeInTheDocument();
    }
  });

  it("highlights current dealer", () => {
    renderWithProviders(
      <ChangeDealerModal
        currentDealerId={2}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    const bobButton = screen.getByLabelText("Sélectionner Bob");
    expect(bobButton.className).toContain("ring-2");
  });

  it("calls onConfirm with selected player id", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ChangeDealerModal
        currentDealerId={1}
        onClose={() => {}}
        onConfirm={onConfirm}
        open={true}
        players={players}
      />,
    );

    // Select Charlie
    fireEvent.click(screen.getByLabelText("Sélectionner Charlie"));
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(3);
    });
  });

  it("disables submit button when same dealer is selected", () => {
    renderWithProviders(
      <ChangeDealerModal
        currentDealerId={1}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Valider" });
    expect(submitButton).toBeDisabled();
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <ChangeDealerModal
        currentDealerId={1}
        onClose={() => {}}
        onConfirm={() => {}}
        open={false}
        players={players}
      />,
    );

    expect(screen.queryByText("Choisir le donneur")).not.toBeInTheDocument();
  });

  it("disables submit button when isPending is true", () => {
    renderWithProviders(
      <ChangeDealerModal
        currentDealerId={1}
        isPending={true}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    // Select a different player first
    fireEvent.click(screen.getByLabelText("Sélectionner Bob"));

    const submitButton = screen.getByRole("button", { name: "Valider" });
    expect(submitButton).toBeDisabled();
  });
});
