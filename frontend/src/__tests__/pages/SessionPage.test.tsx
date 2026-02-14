import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionPage from "../../pages/SessionPage";
import * as useAddStarModule from "../../hooks/useAddStar";
import * as useCompleteGameModule from "../../hooks/useCompleteGame";
import * as useCreateGameModule from "../../hooks/useCreateGame";
import * as useCreatePlayerModule from "../../hooks/useCreatePlayer";
import * as useCreateSessionModule from "../../hooks/useCreateSession";
import * as useDeleteGameModule from "../../hooks/useDeleteGame";
import * as usePlayerGroupsModule from "../../hooks/usePlayerGroups";
import * as usePlayersModule from "../../hooks/usePlayers";
import * as useSessionModule from "../../hooks/useSession";
import * as useSessionGamesModule from "../../hooks/useSessionGames";
import * as useUpdateSessionGroupModule from "../../hooks/useUpdateSessionGroup";
import { renderWithProviders } from "../test-utils";
import type { Game, SessionDetail } from "../../types/api";

vi.mock("../../hooks/useAddStar");
vi.mock("../../hooks/useCompleteGame");
vi.mock("../../hooks/useCreateGame");
vi.mock("../../hooks/useCreatePlayer");
vi.mock("../../hooks/useCreateSession");
vi.mock("../../hooks/useDeleteGame");
vi.mock("../../hooks/usePlayerGroups");
vi.mock("../../hooks/usePlayers");
vi.mock("../../hooks/useSession");
vi.mock("../../hooks/useSessionGames");
vi.mock("../../hooks/useUpdateSessionGroup");

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

const mockSession: SessionDetail = {
  createdAt: "2025-02-01T14:00:00+00:00",
  cumulativeScores: [
    { playerId: 1, playerName: "Alice", score: 120 },
    { playerId: 2, playerName: "Bob", score: -30 },
  ],
  id: 1,
  isActive: true,
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
  createGame?: Partial<ReturnType<typeof useCreateGameModule.useCreateGame>>;
  useSession?: Partial<ReturnType<typeof useSessionModule.useSession>>;
  useSessionGames?: Partial<ReturnType<typeof useSessionGamesModule.useSessionGames>>;
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

  vi.mocked(useSessionGamesModule.useSessionGames).mockReturnValue({
    data: { pageParams: [1], pages: [mockGamesPage] },
    dataUpdatedAt: 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchNextPage: vi.fn(),
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

  vi.mocked(usePlayerGroupsModule.usePlayerGroups).mockReturnValue({
    data: [],
    dataUpdatedAt: 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: "idle",
    groups: [],
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
    promise: Promise.resolve([]),
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

  return { createGameMutate };
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
      screen.getByRole("button", { name: "Modifier les joueurs" }),
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
});
