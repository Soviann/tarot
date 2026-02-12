import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompleteGameModal from "../../components/CompleteGameModal";
import * as useCompleteGameModule from "../../hooks/useCompleteGame";
import type { Game } from "../../types/api";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useCompleteGame");

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
    // Bob should be selected as partner (ring-2)
    expect(screen.getByRole("img", { name: "Bob" }).closest("button")).toHaveClass("ring-2");
  });

  it("shows error message when mutation fails", () => {
    const error = new Error("Server error");
    setupMock({ error, isError: true });
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open players={mockPlayers} sessionId={1} />,
    );

    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    setupMock();
    renderWithProviders(
      <CompleteGameModal game={inProgressGame} onClose={vi.fn()} open={false} players={mockPlayers} sessionId={1} />,
    );

    expect(screen.queryByText("Compléter la donne")).not.toBeInTheDocument();
  });
});
