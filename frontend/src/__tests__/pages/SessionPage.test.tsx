import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import SessionPage from "../../pages/SessionPage";

vi.mock("react-countup", () => ({
  default: ({ end, formattingFn }: { end: number; formattingFn?: (n: number) => string }) =>
    formattingFn ? formattingFn(end) : String(end),
}));
import * as useAddStarModule from "../../hooks/useAddStar";
import * as useAllSessionGamesModule from "../../hooks/useAllSessionGames";
import * as useCloseSessionModule from "../../hooks/useCloseSession";
import * as useCompleteGameModule from "../../hooks/useCompleteGame";
import * as useCreateGameModule from "../../hooks/useCreateGame";
import * as useCreatePlayerModule from "../../hooks/useCreatePlayer";
import * as useCreateSessionModule from "../../hooks/useCreateSession";
import * as useDeleteGameModule from "../../hooks/useDeleteGame";
import * as useGameEventListenerModule from "../../hooks/useGameEventListener";
import * as usePlayerGroupsModule from "../../hooks/usePlayerGroups";
import * as usePlayersModule from "../../hooks/usePlayers";
import * as useReorderPlayersModule from "../../hooks/useReorderPlayers";
import * as useSessionModule from "../../hooks/useSession";
import * as useSessionGamesModule from "../../hooks/useSessionGames";
import * as useShakeModule from "../../hooks/useShake";
import * as useUpdateDealerModule from "../../hooks/useUpdateDealer";
import * as useUpdateSessionGroupModule from "../../hooks/useUpdateSessionGroup";
import * as apiModule from "../../services/api";
import { selectMeme } from "../../services/memeSelector";
import { renderWithProviders } from "../test-utils";
import type { Game, PlayerGroupDetail, SessionDetail } from "../../types/api";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));
vi.mock("../../hooks/useAddStar");
vi.mock("../../hooks/useCloseSession");
vi.mock("../../hooks/useCompleteGame");
vi.mock("../../hooks/useCreateGame");
vi.mock("../../hooks/useCreatePlayer");
vi.mock("../../hooks/useCreateSession");
vi.mock("../../hooks/useDeleteGame");
vi.mock("../../hooks/usePlayerGroups");
vi.mock("../../hooks/usePlayers");
vi.mock("../../hooks/useSession");
vi.mock("../../hooks/useSessionGames");
vi.mock("../../hooks/useUpdateDealer");
vi.mock("../../hooks/useAllSessionGames");
vi.mock("../../hooks/useGameEventListener");
vi.mock("../../hooks/useReorderPlayers");
vi.mock("../../hooks/useShake");
vi.mock("../../hooks/useUpdateSessionGroup");
vi.mock("../../services/gameEvents", () => ({
  gameEvents: { emit: vi.fn(), off: vi.fn(), on: vi.fn() },
}));
vi.mock("../../services/memeSelector", () => ({
  selectMeme: vi.fn(),
}));
vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

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

const mockCompletedGame: Game = {
  chelem: "none",
  completedAt: "2025-02-01T14:05:00+00:00",
  contract: "garde",
  createdAt: "2025-02-01T14:10:00+00:00",
  dealer: null,
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
};

const mockInProgressGame: Game = {
  chelem: "none",
  completedAt: null,
  contract: "petite",
  createdAt: "2025-02-01T14:20:00+00:00",
  dealer: null,
  id: 2,
  oudlers: null,
  partner: null,
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: null,
  position: 2,
  scoreEntries: [],
  status: "in_progress",
  taker: { id: 3, name: "Charlie" },
};

const mockCompletedGame2: Game = {
  chelem: "none",
  completedAt: "2025-02-01T14:15:00+00:00",
  contract: "petite",
  createdAt: "2025-02-01T14:12:00+00:00",
  dealer: null,
  id: 3,
  oudlers: 1,
  partner: { color: null, id: 3, name: "Charlie" },
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 40,
  position: 2,
  scoreEntries: [
    { id: 6, player: { color: null, id: 2, name: "Bob" }, score: 60 },
    { id: 7, player: { color: null, id: 3, name: "Charlie" }, score: 60 },
    { id: 8, player: { color: null, id: 1, name: "Alice" }, score: -40 },
    { id: 9, player: { color: null, id: 4, name: "Diana" }, score: -40 },
    { id: 10, player: { color: null, id: 5, name: "Eve" }, score: -40 },
  ],
  status: "completed",
  taker: { color: null, id: 2, name: "Bob" },
};

const mockSession: SessionDetail = {
  createdAt: "2025-02-01T14:00:00+00:00",
  cumulativeScores: [
    { playerId: 1, playerName: "Alice", score: 120 },
    { playerId: 2, playerName: "Bob", score: -30 },
  ],
  currentDealer: null,
  id: 1,
  isActive: true,
  playerGroup: null,
  playerOrder: null,
  players: mockPlayers,
  starEvents: [],
};

const mockSessionWithInProgress: SessionDetail = {
  ...mockSession,
  inProgressGame: mockInProgressGame,
};

const mockGamesPage = {
  member: [mockCompletedGame],
  totalItems: 1,
};

function setupMocks(overrides?: {
  allGames?: Game[];
  createGame?: Partial<ReturnType<typeof useCreateGameModule.useCreateGame>>;
  groups?: PlayerGroupDetail[];
  useSession?: Partial<ReturnType<typeof useSessionModule.useSession>>;
  useSessionGames?: Partial<ReturnType<typeof useSessionGamesModule.useSessionGames>>;
}) {
  const closeSessionMutate = vi.fn();
  const createGameMutate = vi.fn();
  const fetchNextPage = vi.fn();
  const reorderMutate = vi.fn();

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

  vi.mocked(useAllSessionGamesModule.useAllSessionGames).mockReturnValue({
    data: overrides?.allGames ?? [mockCompletedGame],
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
    promise: Promise.resolve(overrides?.allGames ?? [mockCompletedGame]),
    refetch: vi.fn(),
    status: "success",
  } as unknown as ReturnType<typeof useAllSessionGamesModule.useAllSessionGames>);

  vi.mocked(useCloseSessionModule.useCloseSession).mockReturnValue({
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
    mutate: closeSessionMutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
  } as unknown as ReturnType<typeof useCloseSessionModule.useCloseSession>);

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

  vi.mocked(useSessionGamesModule.useSessionGames).mockReturnValue({
    data: { pageParams: [1], pages: [mockGamesPage] },
    dataUpdatedAt: 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchNextPage,
    fetchPreviousPage: vi.fn(),
    fetchStatus: "idle",
    hasNextPage: false,
    hasPreviousPage: false,
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
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
    promise: Promise.resolve({ pageParams: [1], pages: [mockGamesPage] }),
    refetch: vi.fn(),
    status: "success",
    ...overrides?.useSessionGames,
  } as unknown as ReturnType<typeof useSessionGamesModule.useSessionGames>);

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

  vi.mocked(useCreateSessionModule.useCreateSession).mockReturnValue({
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
  } as unknown as ReturnType<typeof useCreateSessionModule.useCreateSession>);

  vi.mocked(usePlayersModule.usePlayers).mockReturnValue({
    data: { member: [], totalItems: 0 },
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
    players: [],
    promise: Promise.resolve({ member: [], totalItems: 0 }),
    refetch: vi.fn(),
    status: "success",
  } as unknown as ReturnType<typeof usePlayersModule.usePlayers>);

  vi.mocked(useCreatePlayerModule.useCreatePlayer).mockReturnValue({
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
  } as unknown as ReturnType<typeof useCreatePlayerModule.useCreatePlayer>);

  vi.mocked(useGameEventListenerModule.useGameEventListener).mockImplementation(() => {});

  vi.mocked(usePlayerGroupsModule.usePlayerGroups).mockReturnValue({
    data: overrides?.groups ?? [],
    dataUpdatedAt: 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    groups: overrides?.groups ?? [],
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
    promise: Promise.resolve(overrides?.groups ?? []),
    refetch: vi.fn(),
    status: "success",
  } as unknown as ReturnType<typeof usePlayerGroupsModule.usePlayerGroups>);

  vi.mocked(useUpdateSessionGroupModule.useUpdateSessionGroup).mockReturnValue({
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
  } as unknown as ReturnType<typeof useUpdateSessionGroupModule.useUpdateSessionGroup>);

  vi.mocked(useReorderPlayersModule.useReorderPlayers).mockReturnValue({
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
    mutate: reorderMutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
  } as unknown as ReturnType<typeof useReorderPlayersModule.useReorderPlayers>);

  vi.mocked(useShakeModule.useShake).mockImplementation(() => {});
  vi.mocked(selectMeme).mockReturnValue(null);

  vi.mocked(useUpdateDealerModule.useUpdateDealer).mockReturnValue({
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
  } as unknown as ReturnType<typeof useUpdateDealerModule.useUpdateDealer>);

  return { closeSessionMutate, createGameMutate, fetchNextPage, reorderMutate };
}

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

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows not found when session is null after loading", () => {
    setupMocks({
      useSession: { isSuccess: true, session: null },
    });
    renderWithProviders(<SessionPage />);

    expect(screen.getByRole("heading", { level: 1, name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
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

  it("shows overflow menu with session actions", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));

    expect(screen.getByText("Récap de session")).toBeInTheDocument();
    expect(screen.getByText("Partager (QR)")).toBeInTheDocument();
    expect(screen.getByText("Modifier les joueurs")).toBeInTheDocument();
  });

  it("disables swap players in overflow menu when a game is in progress", async () => {
    setupMocks({
      useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
    });
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));

    expect(
      screen.getByRole("menuitem", { name: "Modifier les joueurs" }),
    ).toBeDisabled();
  });

  it("opens SwapPlayersModal from overflow menu", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Modifier les joueurs"));

    expect(
      screen.getByText("Modifier les joueurs", { selector: "h2" }),
    ).toBeInTheDocument();
  });

  it("opens ShareQrCodeModal from overflow menu", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Partager (QR)"));

    expect(screen.getByText("Partager la session")).toBeInTheDocument();
  });

  it("shows close session confirmation modal from overflow menu", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Terminer la session"));

    expect(screen.getByText("Terminer la session", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText(/Voulez-vous terminer cette session/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terminer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();
  });

  it("calls closeSession.mutate when confirming close", async () => {
    const { closeSessionMutate } = setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Terminer la session"));
    await userEvent.click(screen.getByRole("button", { name: "Terminer" }));

    expect(closeSessionMutate).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it("cancels close session modal without calling mutate", async () => {
    const { closeSessionMutate } = setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Terminer la session"));
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(closeSessionMutate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/Voulez-vous terminer/)).not.toBeInTheDocument();
    });
  });

  it("does not show reopen or close option for inactive sessions", async () => {
    const mockInactiveSession: SessionDetail = { ...mockSession, isActive: false };
    setupMocks({
      useSession: { data: mockInactiveSession, session: mockInactiveSession },
    });
    renderWithProviders(<SessionPage />);

    expect(screen.getByText("Session terminée")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nouvelle donne" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    expect(screen.queryByText("Réouvrir la session")).not.toBeInTheDocument();
    expect(screen.queryByText("Terminer la session")).not.toBeInTheDocument();
  });

  it("shows toast error when undo fails", async () => {
    // Make useCompleteGame.mutate call onSuccess immediately to trigger onGameSaved
    const mockCompleteMutate = vi.fn().mockImplementation(
      (_payload: unknown, options?: { onSuccess?: (data: { newBadges: Record<string, never> }) => void }) => {
        options?.onSuccess?.({ newBadges: {} });
      },
    );

    setupMocks({
      useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
    });

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
      mutate: mockCompleteMutate,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      status: "idle",
      submittedAt: 0,
      variables: undefined,
    } as unknown as ReturnType<typeof useCompleteGameModule.useCompleteGame>);

    vi.mocked(apiModule.apiFetch).mockRejectedValue(new Error("Erreur réseau"));

    renderWithProviders(<SessionPage />);

    // Open CompleteGameModal
    await userEvent.click(screen.getByRole("button", { name: "Compléter" }));

    // Fill form: select "Seul" as partner, enter points
    await userEvent.click(screen.getByText("Seul"));
    await userEvent.type(screen.getByPlaceholderText("Points"), "51");

    // Submit → triggers onGameSaved → UndoFAB appears
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    // Click undo
    const undoBtn = await screen.findByRole("button", { name: "Annuler la donne" });
    await userEvent.click(undoBtn);

    // Should show toast error and have called correct endpoint
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erreur lors de l'annulation de la donne");
    });
    expect(apiModule.apiFetch).toHaveBeenCalledWith("/games/2", { method: "DELETE" });
  });

  it("shows ScoreEvolutionChart when at least 2 completed games", () => {
    setupMocks({
      allGames: [mockCompletedGame, mockCompletedGame2],
    });
    renderWithProviders(<SessionPage />);

    expect(screen.getByText("Évolution des scores")).toBeInTheDocument();
  });

  it("hides ScoreEvolutionChart when fewer than 2 completed games", () => {
    setupMocks({
      allGames: [mockCompletedGame],
    });
    renderWithProviders(<SessionPage />);

    expect(screen.queryByText("Évolution des scores")).not.toBeInTheDocument();
  });

  it("opens ReorderPlayersModal from overflow menu", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Changer l'ordre"));

    expect(screen.getByText("Changer l'ordre", { selector: "h2" })).toBeInTheDocument();
  });

  it("shows 'Changer le groupe' in overflow menu when groups exist", async () => {
    setupMocks({
      groups: [{ createdAt: "2025-01-01", id: 10, name: "Groupe A", players: [{ color: null, id: 1, name: "Alice" }] }],
    });
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));

    expect(screen.getByText("Changer le groupe")).toBeInTheDocument();
  });

  it("hides 'Changer le groupe' in overflow menu when no groups", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));

    expect(screen.queryByText("Changer le groupe")).not.toBeInTheDocument();
  });

  it("calls fetchNextPage when 'Voir plus' is clicked", async () => {
    const { fetchNextPage } = setupMocks({
      useSessionGames: { hasNextPage: true },
    });
    renderWithProviders(<SessionPage />);

    const loadMoreBtn = screen.getByRole("button", { name: "Voir plus" });
    await userEvent.click(loadMoreBtn);

    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("does not show 'Voir plus' when hasNextPage is false", () => {
    setupMocks({
      useSessionGames: { hasNextPage: false },
    });
    renderWithProviders(<SessionPage />);

    expect(screen.queryByRole("button", { name: "Voir plus" })).not.toBeInTheDocument();
  });

  it("has a link to session summary in overflow menu", async () => {
    setupMocks();
    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));

    const link = screen.getByText("Récap de session").closest("a");
    expect(link).toHaveAttribute("href", "/sessions/1/summary");
  });

  it("redirects to summary after confirming close session", async () => {
    const closeSessionMutateWithSuccess = vi.fn().mockImplementation(
      (_val: unknown, opts?: { onSuccess?: () => void }) => {
        opts?.onSuccess?.();
      },
    );

    setupMocks();

    vi.mocked(useCloseSessionModule.useCloseSession).mockReturnValue({
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
      mutate: closeSessionMutateWithSuccess,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      status: "idle",
      submittedAt: 0,
      variables: undefined,
    } as unknown as ReturnType<typeof useCloseSessionModule.useCloseSession>);

    renderWithProviders(<SessionPage />);

    await userEvent.click(screen.getByRole("button", { name: "Actions de session" }));
    await userEvent.click(screen.getByText("Terminer la session"));
    await userEvent.click(screen.getByRole("button", { name: "Terminer" }));

    expect(mockNavigate).toHaveBeenCalledWith("/sessions/1/summary");
  });

  it("shows MemeOverlay when selectMeme returns a meme after game event", () => {
    setupMocks();

    let capturedHandler: ((payload: unknown) => void) | null = null;
    vi.mocked(useGameEventListenerModule.useGameEventListener).mockImplementation(
      ((_event: string, handler: (payload: unknown) => void) => {
        capturedHandler = handler;
      }) as typeof useGameEventListenerModule.useGameEventListener,
    );
    vi.mocked(selectMeme).mockReturnValue({
      caption: "Test meme",
      id: "test-meme",
      image: "/memes/test.webp",
    });

    renderWithProviders(<SessionPage />);

    act(() => {
      capturedHandler?.({
        context: {
          attackWins: true,
          chelem: "none",
          consecutiveLosses: 0,
          contract: "garde",
          isSelfCall: false,
          oudlers: 2,
          petitAuBout: "none",
          points: 56,
          previousScore: null,
          takerScore: 120,
        },
      });
    });

    expect(screen.getByRole("dialog", { name: "Mème" })).toBeInTheDocument();
    expect(screen.getByAltText("Test meme")).toBeInTheDocument();
  });

  it("dismisses MemeOverlay on click", async () => {
    setupMocks();

    let capturedHandler: ((payload: unknown) => void) | null = null;
    vi.mocked(useGameEventListenerModule.useGameEventListener).mockImplementation(
      ((_event: string, handler: (payload: unknown) => void) => {
        capturedHandler = handler;
      }) as typeof useGameEventListenerModule.useGameEventListener,
    );
    vi.mocked(selectMeme).mockReturnValue({
      caption: "Test meme",
      id: "test-meme",
      image: "/memes/test.webp",
    });

    renderWithProviders(<SessionPage />);

    act(() => {
      capturedHandler?.({
        context: {
          attackWins: true,
          chelem: "none",
          consecutiveLosses: 0,
          contract: "garde",
          isSelfCall: false,
          oudlers: 2,
          petitAuBout: "none",
          points: 56,
          previousScore: null,
          takerScore: 120,
        },
      });
    });

    expect(screen.getByRole("dialog", { name: "Mème" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("dialog", { name: "Mème" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Mème" })).not.toBeInTheDocument();
    });
  });

  it("inverts scores on shake then shows modal after delay", () => {
    vi.useFakeTimers();
    setupMocks();

    let capturedOnShake: (() => void) | null = null;
    vi.mocked(useShakeModule.useShake).mockImplementation((onShake) => {
      capturedOnShake = onShake;
    });

    renderWithProviders(<SessionPage />);

    // Initially no inverted indicator
    expect(screen.queryByTitle("Classement inversé")).not.toBeInTheDocument();

    // Shake → scores inverted
    act(() => {
      capturedOnShake?.();
    });
    expect(screen.getByTitle("Classement inversé")).toBeInTheDocument();

    // After 12s delay → inversion removed and modal shown
    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.queryByTitle("Classement inversé")).not.toBeInTheDocument();
    expect(screen.getByText("Eh non, bien essayé 😏")).toBeInTheDocument();

    vi.useRealTimers();
  });

  // ---------------------------------------------------------------
  // Orchestration modales
  // ---------------------------------------------------------------

  describe("orchestration modales", () => {
    it("ouvrir NewGameModal → fermer → ouvrir CompleteGameModal (mode édition) sans interférence", async () => {
      setupMocks();
      renderWithProviders(<SessionPage />);

      // Ouvrir NewGameModal via FAB
      await userEvent.click(screen.getByRole("button", { name: "Nouvelle donne" }));
      expect(screen.getByText("Nouvelle donne", { selector: "h2" })).toBeInTheDocument();

      // Fermer NewGameModal
      await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
      await waitFor(() => {
        expect(screen.queryByText("Nouvelle donne", { selector: "h2" })).not.toBeInTheDocument();
      });

      // Ouvrir CompleteGameModal en mode édition → pas d'interférence d'état
      await userEvent.click(screen.getByRole("button", { name: "Modifier" }));
      expect(screen.getByText("Modifier la donne")).toBeInTheDocument();
      // Les champs du mode édition sont pré-remplis (vient de lastCompletedGame, pas de NewGameModal)
      expect(screen.getByPlaceholderText("Points")).toHaveValue("56");
    });

    it("passe inProgressGame à CompleteGameModal et lastCompletedGame au mode édition", async () => {
      setupMocks({
        useSession: { data: mockSessionWithInProgress, session: mockSessionWithInProgress },
      });
      renderWithProviders(<SessionPage />);

      // CompleteGameModal en complétion → reçoit inProgressGame (Charlie, Petite)
      await userEvent.click(screen.getByRole("button", { name: "Compléter" }));
      expect(screen.getByText("Compléter la donne")).toBeInTheDocument();
      // Le bandeau info dans la modale montre le preneur de l'inProgressGame (Charlie + Petite)
      const modal = screen.getByText("Compléter la donne").closest("[role='dialog']")!;
      expect(within(modal).getByText("Charlie")).toBeInTheDocument();
      expect(within(modal).getByText("Petite")).toBeInTheDocument();
    });

    it("pas de bouton Modifier quand aucune donne complétée", () => {
      setupMocks({
        useSessionGames: {
          data: { pageParams: [1], pages: [{ member: [], totalItems: 0 }] },
        },
      });
      renderWithProviders(<SessionPage />);

      expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    });

    it("affiche erreur quand la session ne charge pas", () => {
      setupMocks({
        useSession: {
          isError: true,
          isPending: false,
          isSuccess: false,
          session: null,
        },
      });
      renderWithProviders(<SessionPage />);

      // Session null → NotFound affiché
      expect(screen.getByRole("heading", { level: 1, name: /404/ })).toBeInTheDocument();
    });
  });
});
