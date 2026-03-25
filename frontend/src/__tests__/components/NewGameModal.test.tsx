import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewGameModal from "../../components/NewGameModal";
import type { useCreateGame } from "../../hooks/useCreateGame";
import { Chelem, Contract, GameStatus, Poignee, Side } from "../../types/enums";
import { renderWithProviders } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

import { apiFetch } from "../../services/api";
import type { Game } from "../../types/api";

const mockApiFetch = vi.mocked(apiFetch);

afterEach(() => {
  vi.clearAllMocks();
});

const mockPlayers = [
  { color: null, id: 1, name: "Alice" },
  { color: null, id: 2, name: "Bob" },
  { color: null, id: 3, name: "Charlie" },
  { color: null, id: 4, name: "Diana" },
  { color: null, id: 5, name: "Eve" },
];

const mockCreatedGame: Game = {
  chelem: Chelem.None,
  completedAt: null,
  contract: Contract.Garde,
  createdAt: "2026-03-25T10:00:00+00:00",
  dealer: { color: null, id: 1, name: "Alice" },
  id: 42,
  oudlers: null,
  partner: null,
  petitAuBout: Side.None,
  poignee: Poignee.None,
  poigneeOwner: Side.None,
  points: null,
  position: 1,
  scoreEntries: [],
  status: GameStatus.InProgress,
  taker: { color: null, id: 3, name: "Charlie" },
};

const mockCompletedGame: Game = {
  ...mockCreatedGame,
  chelem: Chelem.None,
  completedAt: "2026-03-25T10:01:00+00:00",
  newBadges: { "3": [{ description: "Test badge", emoji: "🏆", label: "Champion", type: "champion", unlockedAt: "2026-03-25T10:01:00+00:00" }] },
  oudlers: 2,
  points: 45,
  status: GameStatus.Completed,
};

function createMockCreateGame(
  overrides?: Partial<ReturnType<typeof useCreateGame>>,
): ReturnType<typeof useCreateGame> {
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPaused: false,
    isPending: false,
    isSuccess: false,
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useCreateGame>;
}

describe("NewGameModal", () => {
  it("renders player avatars for all players", () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    for (const player of mockPlayers) {
      expect(screen.getByRole("img", { name: player.name })).toBeInTheDocument();
    }
  });

  it("renders all 4 contract buttons", () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    expect(screen.getByRole("button", { name: "Petite" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Garde" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Garde Sans" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Garde Contre" })).toBeInTheDocument();
  });

  it("highlights selected player with ring", async () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    const aliceAvatar = screen.getByRole("img", { name: "Alice" });
    await userEvent.click(aliceAvatar.closest("button")!);

    expect(aliceAvatar.closest("button")).toHaveClass("ring-2");
  });

  it("highlights selected contract with strong visual cues", async () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    const gardeButton = screen.getByRole("button", { name: "Garde" });
    await userEvent.click(gardeButton);

    expect(gardeButton).toHaveClass("ring-3");
    expect(gardeButton).toHaveClass("scale-105");
  });

  it("dims unselected contracts when one is selected", async () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Garde" }));

    expect(screen.getByRole("button", { name: "Petite" })).toHaveClass("opacity-50");
    expect(screen.getByRole("button", { name: "Garde Sans" })).toHaveClass("opacity-50");
    expect(screen.getByRole("button", { name: "Garde Contre" })).toHaveClass("opacity-50");
  });

  it("disables validate button when no player selected", () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
  });

  it("disables validate button when no contract selected", async () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    // Select a player but no contract
    await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);

    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
  });

  it("enables validate button when player and contract are selected", async () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
    await userEvent.click(screen.getByRole("button", { name: "Garde" }));

    expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
  });

  it("calls mutate with correct payload on submit", async () => {
    const mutate = vi.fn();
    const createGame = createMockCreateGame({ mutate });
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    await userEvent.click(screen.getByRole("img", { name: "Charlie" }).closest("button")!);
    await userEvent.click(screen.getByRole("button", { name: "Garde" }));
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(mutate).toHaveBeenCalledWith(
      { contract: "garde", takerId: 3 },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("calls onClose when mutation succeeds", async () => {
    const onClose = vi.fn();
    const mutate = vi.fn((_data: unknown, opts: { onSuccess?: () => void }) => {
      opts.onSuccess?.();
    });
    const createGame = createMockCreateGame({ mutate: mutate as ReturnType<typeof useCreateGame>["mutate"] });
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={onClose} open players={mockPlayers} />,
    );

    await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
    await userEvent.click(screen.getByRole("button", { name: "Petite" }));
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("shows error message when mutation fails", () => {
    const error = new Error("Server error");
    const createGame = createMockCreateGame({ error, isError: true });
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open={false} players={mockPlayers} />,
    );

    expect(screen.queryByText("Nouvelle donne")).not.toBeInTheDocument();
  });

  describe("Même config shortcut", () => {
    const lastGameConfig = { contract: Contract.Garde, takerId: 2 };

    it("does not show button when no lastGameConfig", () => {
      const createGame = createMockCreateGame();
      renderWithProviders(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
      );

      expect(screen.queryByRole("button", { name: /même config/i })).not.toBeInTheDocument();
    });

    it("shows button when lastGameConfig is provided", () => {
      const createGame = createMockCreateGame();
      renderWithProviders(
        <NewGameModal createGame={createGame} lastGameConfig={lastGameConfig} onClose={vi.fn()} open players={mockPlayers} />,
      );

      expect(screen.getByRole("button", { name: /même config/i })).toBeInTheDocument();
    });

    it("pre-fills taker and contract when clicked", async () => {
      const createGame = createMockCreateGame();
      renderWithProviders(
        <NewGameModal createGame={createGame} lastGameConfig={lastGameConfig} onClose={vi.fn()} open players={mockPlayers} />,
      );

      await userEvent.click(screen.getByRole("button", { name: /même config/i }));

      // Bob (id: 2) should be selected → ring-2 on avatar button
      const bobAvatar = screen.getByRole("img", { name: "Bob" });
      expect(bobAvatar.closest("button")).toHaveClass("ring-2");

      // Garde should be selected → ring-3 + scale-105 on contract button
      expect(screen.getByRole("button", { name: "Garde" })).toHaveClass("ring-3");
      expect(screen.getByRole("button", { name: "Garde" })).toHaveClass("scale-105");

      // Valider should be enabled
      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
    });

    it("allows overriding pre-filled values", async () => {
      const createGame = createMockCreateGame();
      renderWithProviders(
        <NewGameModal createGame={createGame} lastGameConfig={lastGameConfig} onClose={vi.fn()} open players={mockPlayers} />,
      );

      await userEvent.click(screen.getByRole("button", { name: /même config/i }));

      // Override taker: select Charlie instead of Bob
      await userEvent.click(screen.getByRole("img", { name: "Charlie" }).closest("button")!);
      expect(screen.getByRole("img", { name: "Charlie" }).closest("button")).toHaveClass("ring-2");
      expect(screen.getByRole("img", { name: "Bob" }).closest("button")).not.toHaveClass("ring-2");

      // Override contract: select Petite instead of Garde
      await userEvent.click(screen.getByRole("button", { name: "Petite" }));
      expect(screen.getByRole("button", { name: "Petite" })).toHaveClass("ring-3");
    });
  });

  describe("cycle de vie modale", () => {
    it("sélectionner un joueur puis un autre → le premier n'est plus highlighted", async () => {
      const createGame = createMockCreateGame();
      renderWithProviders(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
      );

      // Sélectionner Alice
      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      expect(screen.getByRole("img", { name: "Alice" }).closest("button")).toHaveClass("ring-2");

      // Sélectionner Bob → Alice n'est plus highlighted
      await userEvent.click(screen.getByRole("img", { name: "Bob" }).closest("button")!);
      expect(screen.getByRole("img", { name: "Bob" }).closest("button")).toHaveClass("ring-2");
      expect(screen.getByRole("img", { name: "Alice" }).closest("button")).not.toHaveClass("ring-2");
    });

    it("sélectionner un contrat puis un autre → le premier n'est plus highlighted", async () => {
      const createGame = createMockCreateGame();
      renderWithProviders(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      expect(screen.getByRole("button", { name: "Garde" })).toHaveClass("ring-3");

      await userEvent.click(screen.getByRole("button", { name: "Petite" }));
      expect(screen.getByRole("button", { name: "Petite" })).toHaveClass("ring-3");
      expect(screen.getByRole("button", { name: "Garde" })).not.toHaveClass("ring-3");
    });

    it("ouvrir → sélectionner → fermer → rouvrir → form vierge", async () => {
      const createGame = createMockCreateGame();
      const { rerender } = renderWithProviders(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
      );

      // Sélectionner joueur + contrat
      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();

      // Fermer la modale
      rerender(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open={false} players={mockPlayers} />,
      );

      // Rouvrir la modale
      rerender(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
      );

      // Form doit être vierge
      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
      expect(screen.getByRole("img", { name: "Alice" }).closest("button")).not.toHaveClass("ring-2");
      expect(screen.getByRole("button", { name: "Garde" })).not.toHaveClass("ring-3");
    });

    it("bouton Valider désactivé quand isPending = true", async () => {
      const createGame = createMockCreateGame({ isPending: true });
      const lastGameConfig = { contract: Contract.Garde, takerId: 1 };
      renderWithProviders(
        <NewGameModal createGame={createGame} lastGameConfig={lastGameConfig} onClose={vi.fn()} open players={mockPlayers} />,
      );

      // Appliquer la config pour pré-sélectionner joueur + contrat
      await userEvent.click(screen.getByRole("button", { name: /même config/i }));

      // Joueur et contrat sélectionnés, mais isPending → Valider désactivé
      expect(screen.getByRole("img", { name: "Alice" }).closest("button")).toHaveClass("ring-2");
      expect(screen.getByRole("button", { name: "Garde" })).toHaveClass("ring-3");
      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("createGame.reset() est appelé à l'ouverture", () => {
      const reset = vi.fn();
      const createGame = createMockCreateGame({ reset });
      renderWithProviders(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(reset).toHaveBeenCalled();
    });
  });

  describe("compléter depuis la création", () => {
    function renderModal(overrides?: { mutate?: ReturnType<typeof useCreateGame>["mutate"]; onBadgesUnlocked?: () => void; onClose?: () => void; onGameCompleted?: () => void; onGameSaved?: () => void }) {
      const mutate = overrides?.mutate ?? vi.fn();
      const createGame = createMockCreateGame({ mutate });
      return renderWithProviders(
        <NewGameModal
          createGame={createGame}
          onBadgesUnlocked={overrides?.onBadgesUnlocked}
          onClose={overrides?.onClose ?? vi.fn()}
          onGameCompleted={overrides?.onGameCompleted}
          onGameSaved={overrides?.onGameSaved}
          open
          players={mockPlayers}
          sessionId={1}
        />,
      );
    }

    it("affiche l'accordéon 'Résultat (optionnel)' replié par défaut", () => {
      renderModal();

      expect(screen.getByRole("button", { name: /résultat/i })).toBeInTheDocument();
      // Completion fields not visible
      expect(screen.queryByText("Partenaire")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Points")).not.toBeInTheDocument();
    });

    it("déplier l'accordéon affiche les champs de complétion", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));

      expect(screen.getByText("Partenaire")).toBeInTheDocument();
      expect(screen.getByText("Oudlers")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Points")).toBeInTheDocument();
    });

    it("affiche le sous-accordéon Bonus dans les champs de complétion", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: /bonus/i }));

      expect(screen.getByText("Poignée")).toBeInTheDocument();
      expect(screen.getByText("Petit au bout")).toBeInTheDocument();
      expect(screen.getByText("Chelem")).toBeInTheDocument();
    });

    it("soumet sans complétion → seulement POST, pas de PATCH", async () => {
      const mutate = vi.fn((_data: unknown, opts: { onSuccess?: (data: Game) => void }) => {
        opts.onSuccess?.(mockCreatedGame);
      });
      renderModal({ mutate: mutate as ReturnType<typeof useCreateGame>["mutate"] });

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      expect(mutate).toHaveBeenCalledOnce();
      expect(mockApiFetch).not.toHaveBeenCalled();
    });

    it("soumet avec complétion → POST puis PATCH", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCompletedGame);
      const mutate = vi.fn((_data: unknown, opts: { onSuccess?: (data: Game) => void }) => {
        opts.onSuccess?.(mockCreatedGame);
      });
      const onClose = vi.fn();
      renderModal({ mutate: mutate as ReturnType<typeof useCreateGame>["mutate"], onClose });

      // Select taker + contract
      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));

      // Open completion accordion and fill fields
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.click(screen.getByPlaceholderText("Points"));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");

      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      // POST was called
      expect(mutate).toHaveBeenCalledOnce();

      // PATCH was called with correct payload
      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          "/games/42",
          expect.objectContaining({
            method: "PATCH",
            headers: { "Content-Type": "application/merge-patch+json" },
            body: JSON.stringify({
              chelem: Chelem.None,
              oudlers: 0,
              partner: null,
              petitAuBout: Side.None,
              poignee: Poignee.None,
              poigneeOwner: Side.None,
              points: 51,
              status: GameStatus.Completed,
            }),
          }),
        );
      });

      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("bouton désactivé quand points remplis mais pas de partenaire", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");

      // Points filled but no partner → disabled
      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("affiche l'aperçu des scores quand les champs sont valides", async () => {
      renderModal();

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");

      // 0 oudlers → required 56, 51 < 56 → attack loses
      expect(screen.getByText(/contrat chuté/i)).toBeInTheDocument();
      // "Preneur" appears in both the h3 label and score preview
      expect(screen.getAllByText("Preneur")).toHaveLength(2);
    });

    it("déclenche onGameCompleted avec le contexte meme après complétion", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCompletedGame);
      const onGameCompleted = vi.fn();
      const mutate = vi.fn((_data: unknown, opts: { onSuccess?: (data: Game) => void }) => {
        opts.onSuccess?.(mockCreatedGame);
      });
      renderModal({
        mutate: mutate as ReturnType<typeof useCreateGame>["mutate"],
        onGameCompleted,
      });

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      await waitFor(() => {
        expect(onGameCompleted).toHaveBeenCalledWith(
          expect.objectContaining({
            attackWins: false,
            contract: Contract.Garde,
            isSelfCall: true,
            points: 51,
          }),
        );
      });
    });

    it("déclenche onGameSaved avec l'id de la donne après complétion", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCompletedGame);
      const onGameSaved = vi.fn();
      const mutate = vi.fn((_data: unknown, opts: { onSuccess?: (data: Game) => void }) => {
        opts.onSuccess?.(mockCreatedGame);
      });
      renderModal({
        mutate: mutate as ReturnType<typeof useCreateGame>["mutate"],
        onGameSaved,
      });

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      await waitFor(() => {
        expect(onGameSaved).toHaveBeenCalledWith(42);
      });
    });

    it("déclenche onBadgesUnlocked quand la réponse contient des badges", async () => {
      mockApiFetch.mockResolvedValueOnce(mockCompletedGame);
      const onBadgesUnlocked = vi.fn();
      const mutate = vi.fn((_data: unknown, opts: { onSuccess?: (data: Game) => void }) => {
        opts.onSuccess?.(mockCreatedGame);
      });
      renderModal({
        mutate: mutate as ReturnType<typeof useCreateGame>["mutate"],
        onBadgesUnlocked,
      });

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      await waitFor(() => {
        expect(onBadgesUnlocked).toHaveBeenCalledWith(mockCompletedGame.newBadges);
      });
    });

    it("les champs de complétion se réinitialisent à la réouverture", async () => {
      const createGame = createMockCreateGame();
      const { rerender } = renderWithProviders(
        <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Open accordion and fill points
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");
      expect(screen.getByPlaceholderText("Points")).toHaveValue("51");

      // Close and reopen
      rerender(<NewGameModal createGame={createGame} onClose={vi.fn()} open={false} players={mockPlayers} sessionId={1} />);
      rerender(<NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />);

      // Accordion should be collapsed, fields reset
      expect(screen.queryByPlaceholderText("Points")).not.toBeInTheDocument();
    });

    it("PATCH échoue → toast d'avertissement et modal se ferme", async () => {
      mockApiFetch.mockRejectedValueOnce(new Error("Server error"));
      const onClose = vi.fn();
      const mutate = vi.fn((_data: unknown, opts: { onSuccess?: (data: Game) => void }) => {
        opts.onSuccess?.(mockCreatedGame);
      });
      renderModal({
        mutate: mutate as ReturnType<typeof useCreateGame>["mutate"],
        onClose,
      });

      await userEvent.click(screen.getByRole("img", { name: "Alice" }).closest("button")!);
      await userEvent.click(screen.getByRole("button", { name: "Garde" }));
      await userEvent.click(screen.getByRole("button", { name: /résultat/i }));
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "51");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      // Modal still closes even on PATCH failure
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });
  });
});
