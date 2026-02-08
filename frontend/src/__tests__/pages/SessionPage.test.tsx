import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionPage from "../../pages/SessionPage";
import * as useAddStarModule from "../../hooks/useAddStar";
import * as useCompleteGameModule from "../../hooks/useCompleteGame";
import * as useCreateGameModule from "../../hooks/useCreateGame";
import * as useDeleteGameModule from "../../hooks/useDeleteGame";
import * as useSessionModule from "../../hooks/useSession";
import { renderWithProviders } from "../test-utils";
import type { SessionDetail } from "../../types/api";

vi.mock("../../hooks/useAddStar");
vi.mock("../../hooks/useCompleteGame");
vi.mock("../../hooks/useCreateGame");
vi.mock("../../hooks/useDeleteGame");
vi.mock("../../hooks/useSession");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "1" }),
  };
});

const mockPlayers = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Diana" },
  { id: 5, name: "Eve" },
];

const mockSession: SessionDetail = {
  createdAt: "2025-02-01T14:00:00+00:00",
  cumulativeScores: [
    { playerId: 1, playerName: "Alice", score: 120 },
    { playerId: 2, playerName: "Bob", score: -30 },
  ],
  games: [
    {
      chelem: "none",
      contract: "garde",
      createdAt: "2025-02-01T14:10:00+00:00",
      id: 1,
      oudlers: 2,
      partner: { id: 2, name: "Bob" },
      petitAuBout: "none",
      poignee: "none",
      poigneeOwner: "none",
      points: 56,
      position: 1,
      scoreEntries: [
        { id: 1, player: { id: 1, name: "Alice" }, score: 120 },
        { id: 2, player: { id: 2, name: "Bob" }, score: 120 },
        { id: 3, player: { id: 3, name: "Charlie" }, score: -80 },
        { id: 4, player: { id: 4, name: "Diana" }, score: -80 },
        { id: 5, player: { id: 5, name: "Eve" }, score: -80 },
      ],
      status: "completed",
      taker: { id: 1, name: "Alice" },
    },
  ],
  id: 1,
  isActive: true,
  players: mockPlayers,
  starEvents: [],
};

function setupMocks(overrides?: {
  createGame?: Partial<ReturnType<typeof useCreateGameModule.useCreateGame>>;
  useSession?: Partial<ReturnType<typeof useSessionModule.useSession>>;
}) {
  const createGameMutate = vi.fn();

  vi.mocked(useAddStarModule.useAddStar).mockReturnValue({
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
  } as unknown as ReturnType<typeof useAddStarModule.useAddStar>);

  vi.mocked(useSessionModule.useSession).mockReturnValue({
    data: mockSession,
    dataUpdatedAt: 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    promise: Promise.resolve(mockSession),
    refetch: vi.fn(),
    session: mockSession,
    status: "success",
    ...overrides?.useSession,
  } as unknown as ReturnType<typeof useSessionModule.useSession>);

  vi.mocked(useCreateGameModule.useCreateGame).mockReturnValue({
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
    mutate: createGameMutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides?.createGame,
  } as unknown as ReturnType<typeof useCreateGameModule.useCreateGame>);

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
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
  } as unknown as ReturnType<typeof useCompleteGameModule.useCompleteGame>);

  vi.mocked(useDeleteGameModule.useDeleteGame).mockReturnValue({
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
  } as unknown as ReturnType<typeof useDeleteGameModule.useDeleteGame>);

  return { createGameMutate };
}

const mockSessionWithInProgress = {
  ...mockSession,
  games: [
    ...mockSession.games,
    {
      chelem: "none" as const,
      contract: "petite" as const,
      createdAt: "2025-02-01T14:20:00+00:00",
      id: 2,
      oudlers: null,
      partner: null,
      petitAuBout: "none" as const,
      poignee: "none" as const,
      poigneeOwner: "none" as const,
      points: null,
      position: 2,
      scoreEntries: [],
      status: "in_progress" as const,
      taker: { id: 3, name: "Charlie" },
    },
  ],
};

describe("SessionPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockReset();
  });

  it("shows loading state while fetching", () => {
    setupMocks({
      useSession: { isPending: true, session: null },
    });
    renderWithProviders(<SessionPage />);

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("shows not found when session is null after loading", () => {
    setupMocks({
      useSession: { isSuccess: true, session: null },
    });
    renderWithProviders(<SessionPage />);

    expect(screen.getByText("Session introuvable")).toBeInTheDocument();
  });

  it("renders scoreboard with player names", () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    for (const player of mockPlayers) {
      // Player names may appear in both scoreboard and game list
      const matches = screen.getAllByText(player.name);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders cumulative scores", () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    // +120 appears in scoreboard and game list
    const positives = screen.getAllByText("+120");
    expect(positives.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("-30")).toBeInTheDocument();
  });

  it("does not show in-progress banner when no game in progress", () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    expect(
      screen.queryByRole("button", { name: "Compléter" }),
    ).not.toBeInTheDocument();
  });

  it("shows in-progress banner when a game is in progress", () => {
    setupMocks({
      useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
    });
    renderWithProviders(<SessionPage />);

    expect(
      screen.getByRole("button", { name: "Compléter" }),
    ).toBeInTheDocument();
  });

  it("shows game history", () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    expect(screen.getByText("Historique des donnes")).toBeInTheDocument();
    expect(screen.getByText("Garde")).toBeInTheDocument();
  });

  it("shows FAB button", () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    expect(
      screen.getByRole("button", { name: "Nouvelle donne" }),
    ).toBeInTheDocument();
  });

  it("disables FAB when a game is in progress", () => {
    setupMocks({
      useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
    });
    renderWithProviders(<SessionPage />);

    expect(
      screen.getByRole("button", { name: "Nouvelle donne" }),
    ).toBeDisabled();
  });

  it("disables FAB when createGame is pending", () => {
    setupMocks({
      createGame: { isPending: true },
    });
    renderWithProviders(<SessionPage />);

    expect(
      screen.getByRole("button", { name: "Nouvelle donne" }),
    ).toBeDisabled();
  });

  it("navigates back when back button is clicked", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Retour" }));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("opens NewGameModal when FAB is clicked", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Nouvelle donne" }));

    expect(screen.getByText("Nouvelle donne", { selector: "h2" })).toBeInTheDocument();
  });

  it("opens CompleteGameModal when Compléter is clicked", async () => {
    setupMocks({
      useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
    });
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Compléter" }));

    expect(screen.getByText("Compléter la donne")).toBeInTheDocument();
  });

  it("opens edit modal when Modifier is clicked on last game", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(screen.getByText("Modifier la donne")).toBeInTheDocument();
  });

  it("opens delete modal when Supprimer is clicked on last completed game", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(screen.getByText("Supprimer la donne")).toBeInTheDocument();
  });

  it("opens delete modal when Annuler is clicked on in-progress game", async () => {
    setupMocks({
      useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
    });
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText("Supprimer la donne")).toBeInTheDocument();
  });
});
