import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompleteGameModal from "../../components/CompleteGameModal";
import * as useCompleteGameModule from "../../hooks/useCompleteGame";
import * as useVoiceScoringModule from "../../hooks/useVoiceScoring";
import type { VoiceStatus } from "../../hooks/useVoiceScoring";
import type { VoiceScoreResult } from "../../services/voiceScoreParser";
import type { Game } from "../../types/api";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useCompleteGame");
vi.mock("../../hooks/useVoiceScoring");

const mockPlayers = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Diana" },
  { id: 5, name: "Eve" },
];

const inProgressGame: Game = {
  chelem: "none",
  completedAt: null,
  contract: "garde",
  createdAt: "2025-02-01T14:10:00+00:00",
  id: 7,
  oudlers: null,
  partner: null,
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: null,
  position: 1,
  scoreEntries: [],
  status: "in_progress",
  taker: { id: 1, name: "Alice" },
};

const completedGame: Game = {
  chelem: "none",
  completedAt: "2025-02-01T14:05:00+00:00",
  contract: "garde",
  createdAt: "2025-02-01T14:10:00+00:00",
  id: 7,
  oudlers: 2,
  partner: { id: 2, name: "Bob" },
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 45,
  position: 1,
  scoreEntries: [
    { id: 1, player: { id: 1, name: "Alice" }, score: 58 },
    { id: 2, player: { id: 2, name: "Bob" }, score: 29 },
    { id: 3, player: { id: 3, name: "Charlie" }, score: -29 },
    { id: 4, player: { id: 4, name: "Diana" }, score: -29 },
    { id: 5, player: { id: 5, name: "Eve" }, score: -29 },
  ],
  status: "completed",
  taker: { id: 1, name: "Alice" },
};

function setupVoiceMock(overrides?: {
  isSupported?: boolean;
  parsedResult?: VoiceScoreResult;
  status?: VoiceStatus;
  transcript?: string;
}) {
  const start = vi.fn();
  const stop = vi.fn();
  const cancel = vi.fn();
  const reset = vi.fn();
  vi.mocked(useVoiceScoringModule.useVoiceScoring).mockReturnValue({
    cancel,
    error: null,
    isSupported: overrides?.isSupported ?? true,
    parsedResult: overrides?.parsedResult ?? {},
    reset,
    start,
    status: overrides?.status ?? "idle",
    stop,
    transcript: overrides?.transcript ?? "",
  });
  return { cancel, reset, start, stop };
}

function setupMock(overrides?: Partial<ReturnType<typeof useCompleteGameModule.useCompleteGame>>) {
  const mutate = vi.fn();
  vi.mocked(useCompleteGameModule.useCompleteGame).mockReturnValue({
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
    mutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useCompleteGameModule.useCompleteGame>);
  return { mutate };
}

describe("CompleteGameModal", () => {
  beforeEach(() => {
    setupVoiceMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows taker info in banner", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByRole("img", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByText("Garde")).toBeInTheDocument();
  });

  it("shows 'Compléter la donne' title for in_progress game", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByText("Compléter la donne")).toBeInTheDocument();
  });

  it("shows 'Modifier la donne' title for completed game", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={completedGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByText("Modifier la donne")).toBeInTheDocument();
  });

  it("shows partner selection excluding taker", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Taker (Alice) should not be in partner selection
    const partnerSection = screen.getByText("Partenaire").closest("div")!;
    // 4 other players + "Seul" button = 5 buttons in partner section
    expect(partnerSection.querySelectorAll("button").length).toBe(5);
  });

  it("toggles self-call mode", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    const seulButton = screen.getByRole("button", { name: "Seul" });
    await userEvent.click(seulButton);

    expect(seulButton).toHaveClass("ring-2");
  });

  it("shows oudlers stepper", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByText("Oudlers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Augmenter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diminuer" })).toBeInTheDocument();
  });

  it("shows points input with required points indication", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByPlaceholderText("Points")).toBeInTheDocument();
    // Default oudlers = 0, required = 56
    expect(screen.getByText("Requis : 56 pts")).toBeInTheDocument();
  });

  it("updates required points when oudlers change", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    expect(screen.getByText("Requis : 51 pts")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    expect(screen.getByText("Requis : 41 pts")).toBeInTheDocument();
  });

  it("hides bonuses section by default", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.queryByText("Poignée")).not.toBeInTheDocument();
  });

  it("shows bonuses section when expanded", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Bonus/i }));

    expect(screen.getByText("Poignée")).toBeInTheDocument();
    expect(screen.getByText("Petit au bout")).toBeInTheDocument();
    expect(screen.getByText("Chelem")).toBeInTheDocument();
  });

  it("shows score preview when points are entered", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Select partner and enter points
    await userEvent.click(screen.getByRole("button", { name: "Seul" }));
    await userEvent.type(screen.getByPlaceholderText("Points"), "45");

    // Should show score preview (0 oudlers, 45 pts, garde)
    // requis=56, perdu, base=-(56-45+25)×2=-72
    await waitFor(() => {
      expect(screen.getByText(/Contrat chuté/)).toBeInTheDocument();
    });
  });

  it("shows 'Contrat rempli' when attack wins", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Set 3 oudlers (requis=36) and 45 points → win
    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    await userEvent.click(screen.getByRole("button", { name: "Seul" }));
    await userEvent.type(screen.getByPlaceholderText("Points"), "45");

    await waitFor(() => {
      expect(screen.getByText(/Contrat rempli/)).toBeInTheDocument();
    });
  });

  it("disables validate when points are empty", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
  });

  it("disables validate when no partner and not self-call", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Enter points but don't select partner
    await userEvent.type(screen.getByPlaceholderText("Points"), "45");

    expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
  });

  it("calls mutate with correct payload on submit", async () => {
    const { mutate } = setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Select Bob as partner
    await userEvent.click(screen.getByRole("img", { name: "Bob" }).closest("button")!);
    // Set 2 oudlers
    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
    // Enter points
    await userEvent.type(screen.getByPlaceholderText("Points"), "45");
    // Submit
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        chelem: "none",
        oudlers: 2,
        partnerId: 2,
        petitAuBout: "none",
        poignee: "none",
        poigneeOwner: "none",
        points: 45,
        status: "completed",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("sends partnerId as null for self-call", async () => {
    const { mutate } = setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Seul" }));
    await userEvent.type(screen.getByPlaceholderText("Points"), "45");
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ partnerId: null }),
      expect.anything(),
    );
  });

  it("pre-fills fields in edit mode (completed game)", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={completedGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Points should be pre-filled
    expect(screen.getByPlaceholderText("Points")).toHaveValue("45");
    // Oudlers should show 2
    const oudlerStatus = screen.getByRole("status");
    expect(oudlerStatus).toHaveTextContent("2");
    // Bob should be selected as partner (ring-2) — target the one in the partner section
    const partnerHeading = screen.getByRole("heading", { name: "Partenaire" });
    const partnerSection = partnerHeading.closest("div")!;
    expect(partnerSection.querySelector("[role='img'][aria-label='Bob']")!.closest("button")).toHaveClass("ring-2");
  });

  it("shows error message when mutation fails", () => {
    const error = new Error("Server error");
    setupMock({ error, isError: true });
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("shows partner name in banner in edit mode", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={completedGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Banner should show partner info alongside taker
    const banner = screen.getByText("Alice").closest("[class*='bg-surface-secondary']")!;
    expect(banner).toHaveTextContent("Bob");
  });

  it("shows selected partner name in banner when partner chosen", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Select Charlie as partner
    await userEvent.click(screen.getByRole("img", { name: "Charlie" }).closest("button")!);

    // Banner should now show Charlie
    const banner = screen.getByText("Alice").closest("[class*='bg-surface-secondary']")!;
    expect(banner).toHaveTextContent("Charlie");
  });

  it("does not show partner in banner when self-call selected", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Seul" }));

    // Banner should NOT show any partner info
    const banner = screen.getByText("Alice").closest("[class*='bg-surface-secondary']")!;
    expect(banner).not.toHaveTextContent("avec");
  });

  it("allows switching from self-call to a partner", async () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    // Select Seul first
    await userEvent.click(screen.getByRole("button", { name: "Seul" }));
    expect(screen.getByRole("button", { name: "Seul" })).toHaveClass("ring-2");

    // Now click a player — should switch away from Seul
    await userEvent.click(screen.getByRole("img", { name: "Bob" }).closest("button")!);

    // Banner should show Bob
    const banner = screen.getByText("Alice").closest("[class*='bg-surface-secondary']")!;
    expect(banner).toHaveTextContent("Bob");
    // Seul should no longer be active
    expect(screen.getByRole("button", { name: "Seul" })).not.toHaveClass("ring-2");
  });

  it("keeps validate button outside scrollable area", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    const validateButton = screen.getByRole("button", { name: "Valider" });
    // The button must NOT be inside the scrollable container (overflow-y-auto)
    const scrollableContainer = validateButton.closest("[class*='overflow-y-auto']");
    expect(scrollableContainer).toBeNull();
  });

  it("does not render when open is false", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open={false} players={mockPlayers} sessionId={1} />,
    );

    expect(screen.queryByText("Compléter la donne")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------
  // Validation des points
  // ---------------------------------------------------------------

  describe("validation des points", () => {
    it("désactive Valider pour une saisie non numérique (\"abc\")", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "abc");

      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("accepte une saisie décimale .5 (\"45.5\")", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45.5");

      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
    });

    it("accepte une saisie décimale avec virgule (\"45,5\")", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45,5");

      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
    });

    it("rejette une saisie décimale non .5 (\"45.3\")", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45.3");

      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("désactive Valider pour une saisie négative (\"-5\")", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "-5");

      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("désactive Valider pour une saisie > 91", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "92");

      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("accepte points = 91 (borne haute)", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "91");

      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
    });

    it("accepte points = 0 (borne basse) et calcule le score", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "0");

      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
      await waitFor(() => {
        expect(screen.getByText(/Contrat chuté/)).toBeInTheDocument();
      });
    });

    it("traite les espaces autour du nombre (\" 45 \") comme valide", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), " 45 ");

      // Number(" 45 ") === 45, which is valid
      expect(screen.getByRole("button", { name: "Valider" })).toBeEnabled();
    });
  });

  // ---------------------------------------------------------------
  // Interactions bonus
  // ---------------------------------------------------------------

  describe("interactions bonus", () => {
    it("affiche le sélecteur propriétaire poignée quand une poignée est sélectionnée", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: /Bonus/i }));
      await userEvent.click(screen.getByRole("button", { name: "Simple" }));

      expect(screen.getByText("Poignée montrée par")).toBeInTheDocument();
    });

    it("masque le sélecteur propriétaire quand poignée revient à Aucune", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: /Bonus/i }));
      await userEvent.click(screen.getByRole("button", { name: "Simple" }));
      expect(screen.getByText("Poignée montrée par")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Aucune" }));
      expect(screen.queryByText("Poignée montrée par")).not.toBeInTheDocument();
    });

    it("pré-remplit tous les champs bonus en mode édition", () => {
      setupMock();
      const gameWithBonuses: Game = {
        ...completedGame,
        chelem: "announced_won",
        petitAuBout: "attack",
        poignee: "double",
        poigneeOwner: "defense",
      };
      renderWithProviders(
        <CompleteGameModal game={gameWithBonuses} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Bonus section should be auto-expanded
      expect(screen.getByText("Poignée montrée par")).toBeInTheDocument();

      // Poignée Double should be selected
      const poigneeSection = screen.getByText("Poignée").closest("div")!;
      expect(within(poigneeSection).getByRole("button", { name: "Double" })).toHaveClass("bg-accent-500");

      // Petit au bout Attaque should be selected
      const petitSection = screen.getByText("Petit au bout").closest("div")!;
      expect(within(petitSection).getByRole("button", { name: "Attaque" })).toHaveClass("bg-accent-500");

      // Chelem "Annoncé gagné" should be selected
      expect(screen.getByRole("button", { name: "Annoncé gagné" })).toHaveClass("bg-accent-500");

      // Défense should be selected for poignée owner
      const ownerSection = screen.getByText("Poignée montrée par").closest("div")!;
      expect(within(ownerSection).getByRole("button", { name: "Défense" })).toHaveClass("bg-accent-500");
    });

    it("auto-déplie les bonus en mode édition quand un bonus est défini", () => {
      setupMock();
      const gameWithPetitAuBout: Game = {
        ...completedGame,
        petitAuBout: "attack",
      };
      renderWithProviders(
        <CompleteGameModal game={gameWithPetitAuBout} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Bonus section auto-expanded because petitAuBout is set
      expect(screen.getByText("Petit au bout")).toBeInTheDocument();
    });

    it("ne déplie pas les bonus en mode édition quand aucun bonus", () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={completedGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // completedGame has all bonuses set to "none"
      expect(screen.queryByText("Petit au bout")).not.toBeInTheDocument();
    });

    it("réinitialise poigneeOwner à none quand poignée passe à Aucune", async () => {
      const { mutate } = setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Set up valid form
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");

      // Open bonus, select poignée simple then owner attaque
      await userEvent.click(screen.getByRole("button", { name: /Bonus/i }));
      await userEvent.click(screen.getByRole("button", { name: "Simple" }));
      const ownerSection = screen.getByText("Poignée montrée par").closest("div")!;
      await userEvent.click(within(ownerSection).getByRole("button", { name: "Attaque" }));

      // Switch poignée back to Aucune
      const poigneeSection = screen.getByText("Poignée").closest("div")!;
      await userEvent.click(within(poigneeSection).getByRole("button", { name: "Aucune" }));

      // Submit and verify poigneeOwner is "none"
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ poignee: "none", poigneeOwner: "none" }),
        expect.anything(),
      );
    });
  });

  // ---------------------------------------------------------------
  // Flux partenaire
  // ---------------------------------------------------------------

  describe("flux partenaire", () => {
    it("sélectionner partenaire puis cliquer Seul → partnerId = null", async () => {
      const { mutate } = setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Select Bob as partner
      await userEvent.click(screen.getByRole("img", { name: "Bob" }).closest("button")!);
      // Then switch to self-call
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));

      // Enter points and submit
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ partnerId: null }),
        expect.anything(),
      );
    });

    it("cliquer Seul puis sélectionner partenaire → selfCall = false", async () => {
      const { mutate } = setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Self-call first
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      // Then select Bob
      await userEvent.click(screen.getByRole("img", { name: "Bob" }).closest("button")!);

      // Seul should no longer be active
      expect(screen.getByRole("button", { name: "Seul" })).not.toHaveClass("ring-2");

      // Enter points and submit
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ partnerId: 2 }),
        expect.anything(),
      );
    });

    it("boutons partenaire ont une opacité réduite quand selfCall est actif", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));

      // Partner avatar buttons should have opacity-40 class
      const bobButton = screen.getByRole("img", { name: "Bob" }).closest("button")!;
      expect(bobButton).toHaveClass("opacity-40");
    });
  });

  // Voice scoring integration tests
  describe("saisie vocale", () => {
    it("affiche le bouton micro si supporté", () => {
      setupMock();
      setupVoiceMock({ isSupported: true });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.getByRole("button", { name: /dicter/i })).toBeInTheDocument();
    });

    it("masque le bouton micro si non supporté", () => {
      setupMock();
      setupVoiceMock({ isSupported: false });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.queryByRole("button", { name: /dicter/i })).not.toBeInTheDocument();
    });

    it("appelle start() au clic sur le bouton micro", async () => {
      setupMock();
      const { start } = setupVoiceMock({ isSupported: true });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: /dicter/i }));
      expect(start).toHaveBeenCalled();
    });

    it("affiche un indicateur d'écoute pendant la dictée", () => {
      setupMock();
      setupVoiceMock({ isSupported: true, status: "listening" });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.getByRole("button", { name: /arrêter/i })).toBeInTheDocument();
      expect(screen.getByText("Écoute...")).toBeInTheDocument();
    });

    it("pré-remplit les points depuis le résultat vocal", () => {
      setupMock();
      setupVoiceMock({
        isSupported: true,
        parsedResult: { playerName: "Bob", points: 56 },
        status: "result",
      });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.getByPlaceholderText("Points")).toHaveValue("56");
    });

    it("pré-remplit le partenaire depuis le résultat vocal", () => {
      setupMock();
      setupVoiceMock({
        isSupported: true,
        parsedResult: { playerName: "Bob", points: 56 },
        status: "result",
      });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Bob's avatar button in partner section should have selection ring
      const partnerHeading = screen.getByRole("heading", { name: "Partenaire" });
      const partnerSection = partnerHeading.closest("div")!;
      expect(partnerSection.querySelector("[role='img'][aria-label='Bob']")!.closest("button")).toHaveClass("ring-2");
    });

    it("pré-remplit seul depuis __self__", () => {
      setupMock();
      setupVoiceMock({
        isSupported: true,
        parsedResult: { playerName: "__self__", points: 91 },
        status: "result",
      });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.getByRole("button", { name: "Seul" })).toHaveClass("ring-2");
    });

    it("ne masque pas le bouton micro en mode édition", () => {
      setupMock();
      setupVoiceMock({ isSupported: true });
      renderWithProviders(
        <CompleteGameModal game={completedGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.getByRole("button", { name: /dicter/i })).toBeInTheDocument();
    });

    it("met en évidence le champ points pré-rempli par la voix", () => {
      setupMock();
      setupVoiceMock({
        isSupported: true,
        parsedResult: { points: 56 },
        status: "result",
      });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      const pointsInput = screen.getByPlaceholderText("Points");
      expect(pointsInput.className).toContain("ring-green");
    });

    it("applique un second résultat vocal après le premier", () => {
      setupMock();
      // First voice result
      setupVoiceMock({
        isSupported: true,
        parsedResult: { points: 56 },
        status: "result",
      });
      const { rerender } = renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );
      expect(screen.getByPlaceholderText("Points")).toHaveValue("56");

      // User retries voice — goes back to listening then new result
      setupVoiceMock({
        isSupported: true,
        status: "listening",
        transcript: "garde 72 points",
      });
      rerender(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Second voice result with different points
      setupVoiceMock({
        isSupported: true,
        parsedResult: { points: 72 },
        status: "result",
      });
      rerender(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      expect(screen.getByPlaceholderText("Points")).toHaveValue("72");
    });
  });

  // ---------------------------------------------------------------
  // Cycle de vie modale
  // ---------------------------------------------------------------

  describe("cycle de vie modale", () => {
    it("ouvrir en complétion → remplir → fermer → rouvrir → form vierge", async () => {
      setupMock();
      const { rerender } = renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Remplir le formulaire
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");

      // Fermer
      rerender(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open={false} players={mockPlayers} sessionId={1} />,
      );

      // Rouvrir
      rerender(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Form doit être vierge
      expect(screen.getByPlaceholderText("Points")).toHaveValue("");
      expect(screen.getByRole("status")).toHaveTextContent("0");
      expect(screen.getByRole("button", { name: "Seul" })).not.toHaveClass("ring-2");
      expect(screen.getByRole("button", { name: "Valider" })).toBeDisabled();
    });

    it("ouvrir en mode édition → tous les champs pré-remplis", () => {
      setupMock();
      const gameWithAll: Game = {
        ...completedGame,
        chelem: "announced_won",
        oudlers: 3,
        partner: { id: 3, name: "Charlie" },
        petitAuBout: "defense",
        poignee: "simple",
        poigneeOwner: "attack",
        points: 60,
      };
      renderWithProviders(
        <CompleteGameModal game={gameWithAll} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // Points
      expect(screen.getByPlaceholderText("Points")).toHaveValue("60");
      // Oudlers
      expect(screen.getByRole("status")).toHaveTextContent("3");
      // Partenaire Charlie
      const partnerHeading = screen.getByRole("heading", { name: "Partenaire" });
      const partnerSection = partnerHeading.closest("div")!;
      expect(partnerSection.querySelector("[role='img'][aria-label='Charlie']")!.closest("button")).toHaveClass("ring-2");
      // Bonus section auto-ouverte
      expect(screen.getByText("Poignée montrée par")).toBeInTheDocument();
      // Poignée Simple
      const poigneeSection = screen.getByText("Poignée").closest("div")!;
      expect(within(poigneeSection).getByRole("button", { name: "Simple" })).toHaveClass("bg-accent-500");
      // Petit au bout Défense
      const petitSection = screen.getByText("Petit au bout").closest("div")!;
      expect(within(petitSection).getByRole("button", { name: "Défense" })).toHaveClass("bg-accent-500");
      // Chelem Annoncé gagné
      expect(screen.getByRole("button", { name: "Annoncé gagné" })).toHaveClass("bg-accent-500");
    });

    it("aperçu des scores se met à jour quand on change les oudlers", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");

      // 0 oudlers, requis=56, 45 pts → chuté
      await waitFor(() => {
        expect(screen.getByText(/Contrat chuté/)).toBeInTheDocument();
      });

      // 3 oudlers, requis=36, 45 pts → rempli
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));

      await waitFor(() => {
        expect(screen.getByText(/Contrat rempli/)).toBeInTheDocument();
      });
    });

    it("aperçu des scores se met à jour quand on change un bonus", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      // 3 oudlers + 45 pts + seul → contrat rempli
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
      await userEvent.click(screen.getByRole("button", { name: "Augmenter" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");

      await waitFor(() => {
        expect(screen.getByText(/Contrat rempli/)).toBeInTheDocument();
      });

      // Capturer le score preneur avant bonus
      const scoreBeforeBonus = screen.getByText("Preneur").closest("div")!.textContent;

      // Ajouter petit au bout attaque
      await userEvent.click(screen.getByRole("button", { name: /Bonus/i }));
      await userEvent.click(screen.getByRole("button", { name: "Attaque" }));

      // Le score devrait changer
      await waitFor(() => {
        const scoreAfterBonus = screen.getByText("Preneur").closest("div")!.textContent;
        expect(scoreAfterBonus).not.toBe(scoreBeforeBonus);
      });
    });

    it("aperçu disparaît quand on efface les points", async () => {
      setupMock();
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");

      // Aperçu visible
      await waitFor(() => {
        expect(screen.getByText(/Contrat/)).toBeInTheDocument();
      });

      // Effacer les points
      await userEvent.clear(screen.getByPlaceholderText("Points"));

      // Aperçu disparu
      await waitFor(() => {
        expect(screen.queryByText(/Contrat rempli/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Contrat chuté/)).not.toBeInTheDocument();
      });
    });

    it("fermeture de la modale uniquement après succès mutation", async () => {
      const onClose = vi.fn();
      const mutate = vi.fn();
      setupMock({ mutate: mutate as ReturnType<typeof useCompleteGameModule.useCompleteGame>["mutate"] });
      renderWithProviders(
        <CompleteGameModal game={inProgressGame} onClose={onClose} open players={mockPlayers} sessionId={1} />,
      );

      // Remplir et soumettre
      await userEvent.click(screen.getByRole("button", { name: "Seul" }));
      await userEvent.type(screen.getByPlaceholderText("Points"), "45");
      await userEvent.click(screen.getByRole("button", { name: "Valider" }));

      // onClose n'est pas appelé immédiatement (pas encore de succès)
      expect(onClose).not.toHaveBeenCalled();

      // Simuler le succès de la mutation
      const successCallback = mutate.mock.calls[0][1].onSuccess;
      successCallback({ newBadges: {} });

      expect(onClose).toHaveBeenCalled();
    });
  });
});
