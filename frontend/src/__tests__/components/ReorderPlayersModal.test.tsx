import { fireEvent, screen, within } from "@testing-library/react";
import ReorderPlayersModal from "../../components/ReorderPlayersModal";
import { renderWithProviders } from "../test-utils";

const players = [
  { color: null, id: 1, name: "Alice" },
  { color: null, id: 2, name: "Bob" },
  { color: null, id: 3, name: "Charlie" },
  { color: null, id: 4, name: "Diana" },
  { color: null, id: 5, name: "Eve" },
];

describe("ReorderPlayersModal", () => {
  it("affiche tous les joueurs dans l'ordre initial", () => {
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    expect(screen.getByText("Changer l'ordre")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(within(items[0]).getByText("Alice")).toBeInTheDocument();
    expect(within(items[4]).getByText("Eve")).toBeInTheDocument();
  });

  it("déplace un joueur vers le haut", () => {
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    // Move Bob (index 1) up
    fireEvent.click(screen.getByLabelText("Monter Bob"));

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Bob")).toBeInTheDocument();
    expect(within(items[1]).getByText("Alice")).toBeInTheDocument();
  });

  it("déplace un joueur vers le bas", () => {
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    // Move Alice (index 0) down
    fireEvent.click(screen.getByLabelText("Descendre Alice"));

    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Bob")).toBeInTheDocument();
    expect(within(items[1]).getByText("Alice")).toBeInTheDocument();
  });

  it("désactive le bouton monter pour le premier joueur", () => {
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    expect(screen.getByLabelText("Monter Alice")).toBeDisabled();
  });

  it("désactive le bouton descendre pour le dernier joueur", () => {
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    expect(screen.getByLabelText("Descendre Eve")).toBeDisabled();
  });

  it("désactive le bouton valider quand l'ordre n'a pas changé", () => {
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
  });

  it("appelle onConfirm avec le nouvel ordre d'IDs", () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ReorderPlayersModal
        onClose={() => {}}
        onConfirm={onConfirm}
        open={true}
        players={players}
      />,
    );

    // Move Bob up: [Bob, Alice, Charlie, Diana, Eve]
    fireEvent.click(screen.getByLabelText("Monter Bob"));
    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(onConfirm).toHaveBeenCalledWith([2, 1, 3, 4, 5]);
  });

  it("désactive le bouton valider quand isPending est true", () => {
    renderWithProviders(
      <ReorderPlayersModal
        isPending={true}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
        players={players}
      />,
    );

    // Move a player to enable the button normally
    fireEvent.click(screen.getByLabelText("Monter Bob"));

    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
  });
});
