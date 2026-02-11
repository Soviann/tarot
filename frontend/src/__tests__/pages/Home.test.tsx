import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home, { MOTIVATIONAL_MESSAGES } from "../../pages/Home";
import * as useCreatePlayerModule from "../../hooks/useCreatePlayer";
import * as useCreateSessionModule from "../../hooks/useCreateSession";
import * as usePlayersModule from "../../hooks/usePlayers";
import * as useSessionsModule from "../../hooks/useSessions";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useCreatePlayer");
vi.mock("../../hooks/useCreateSession");
vi.mock("../../hooks/usePlayers");
vi.mock("../../hooks/useSessions");

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockPlayers = [
  { active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" },
  { active: true, createdAt: "2025-01-16T10:00:00+00:00", id: 2, name: "Bob" },
  { active: true, createdAt: "2025-01-17T10:00:00+00:00", id: 3, name: "Charlie" },
  { active: true, createdAt: "2025-01-18T10:00:00+00:00", id: 4, name: "Diana" },
  { active: true, createdAt: "2025-01-19T10:00:00+00:00", id: 5, name: "Eve" },
  { active: true, createdAt: "2025-01-20T10:00:00+00:00", id: 6, name: "Frank" },
];

const mockSessions = [
  {
    createdAt: "2025-02-01T14:00:00+00:00",
    id: 1,
    isActive: true,
    lastPlayedAt: "2025-02-10T18:30:00+00:00",
    players: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
      { id: 4, name: "Diana" },
      { id: 5, name: "Eve" },
    ],
  },
];

function setupMocks(overrides?: {
  createPlayer?: Partial<ReturnType<typeof useCreatePlayerModule.useCreatePlayer>>;
  createSession?: Partial<ReturnType<typeof useCreateSessionModule.useCreateSession>>;
  usePlayers?: Partial<ReturnType<typeof usePlayersModule.usePlayers>>;
  useSessions?: Partial<ReturnType<typeof useSessionsModule.useSessions>>;
}) {
  const createPlayerMutate = vi.fn();
  const createSessionMutate = vi.fn();

  vi.mocked(usePlayersModule.usePlayers).mockReturnValue({
    data: mockPlayers,
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
    players: mockPlayers,
    promise: Promise.resolve(mockPlayers),
    refetch: vi.fn(),
    status: "success",
    ...overrides?.usePlayers,
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
    mutate: createPlayerMutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides?.createPlayer,
  } as unknown as ReturnType<typeof useCreatePlayerModule.useCreatePlayer>);

  vi.mocked(useSessionsModule.useSessions).mockReturnValue({
    data: mockSessions,
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
    promise: Promise.resolve(mockSessions),
    refetch: vi.fn(),
    sessions: mockSessions,
    status: "success",
    ...overrides?.useSessions,
  } as unknown as ReturnType<typeof useSessionsModule.useSessions>);

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
    mutate: createSessionMutate,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides?.createSession,
  } as unknown as ReturnType<typeof useCreateSessionModule.useCreateSession>);

  return { createPlayerMutate, createSessionMutate };
}

async function searchFor(text: string) {
  const searchInput = screen.getByPlaceholderText("Rechercher un joueur…");
  await userEvent.type(searchInput, text);
  await waitFor(() => {
    expect(usePlayersModule.usePlayers).toHaveBeenCalledWith(text);
  });
}

describe("Home page", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("renders sessions section before player selection", () => {
    setupMocks();
    renderWithProviders(<Home />);

    const sessionsHeading = screen.getByText("Sessions récentes");
    const selectionHeading = screen.getByText("Nouvelle session");

    // Sessions should appear before player selection in the DOM
    expect(
      sessionsHeading.compareDocumentPosition(selectionHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows a motivational message", () => {
    setupMocks();
    renderWithProviders(<Home />);

    const messages = MOTIVATIONAL_MESSAGES;
    const found = messages.some((msg) => screen.queryByText(msg));
    expect(found).toBe(true);
  });

  it("renders player selector", () => {
    setupMocks();
    renderWithProviders(<Home />);

    expect(screen.getByText("0/5 joueurs sélectionnés")).toBeInTheDocument();
  });

  it("does not show standalone start button", () => {
    setupMocks();
    renderWithProviders(<Home />);

    // The standalone "Démarrer" button should not exist — it's now inside PlayerSelector
    expect(screen.queryByRole("button", { name: "Démarrer" })).not.toBeInTheDocument();
  });

  it("shows start button when 5 players are selected", async () => {
    setupMocks();
    renderWithProviders(<Home />);

    await searchFor("a");

    // Select 5 players
    await userEvent.click(screen.getByText("Alice"));
    await userEvent.click(screen.getByText("Bob"));
    await userEvent.click(screen.getByText("Charlie"));
    await userEvent.click(screen.getByText("Diana"));
    await userEvent.click(screen.getByText("Eve"));

    const startButton = screen.getByRole("button", { name: "Démarrer la session" });
    expect(startButton).toBeInTheDocument();
  });

  it("hides search input when 5 players are selected", async () => {
    setupMocks();
    renderWithProviders(<Home />);

    await searchFor("a");

    // Select 5 players
    await userEvent.click(screen.getByText("Alice"));
    await userEvent.click(screen.getByText("Bob"));
    await userEvent.click(screen.getByText("Charlie"));
    await userEvent.click(screen.getByText("Diana"));
    await userEvent.click(screen.getByText("Eve"));

    expect(screen.queryByPlaceholderText("Rechercher un joueur…")).not.toBeInTheDocument();
  });

  it("calls createSession.mutate with selected player IDs", async () => {
    const { createSessionMutate } = setupMocks();
    renderWithProviders(<Home />);

    await searchFor("a");

    // Select 5 players
    await userEvent.click(screen.getByText("Alice"));
    await userEvent.click(screen.getByText("Bob"));
    await userEvent.click(screen.getByText("Charlie"));
    await userEvent.click(screen.getByText("Diana"));
    await userEvent.click(screen.getByText("Eve"));

    await userEvent.click(screen.getByRole("button", { name: "Démarrer la session" }));

    expect(createSessionMutate).toHaveBeenCalledWith(
      [1, 2, 3, 4, 5],
      expect.anything(),
    );
  });

  it("navigates to session page on success", async () => {
    const { createSessionMutate } = setupMocks();
    // Make mutate call onSuccess callback immediately
    createSessionMutate.mockImplementation((_ids: number[], options?: { onSuccess?: (data: unknown) => void }) => {
      options?.onSuccess?.({ id: 42 });
    });

    renderWithProviders(<Home />);

    await searchFor("a");

    // Select 5 players
    await userEvent.click(screen.getByText("Alice"));
    await userEvent.click(screen.getByText("Bob"));
    await userEvent.click(screen.getByText("Charlie"));
    await userEvent.click(screen.getByText("Diana"));
    await userEvent.click(screen.getByText("Eve"));

    await userEvent.click(screen.getByRole("button", { name: "Démarrer la session" }));

    expect(mockNavigate).toHaveBeenCalledWith("/sessions/42");
  });

  it("disables start button when mutation is pending", async () => {
    setupMocks({
      createSession: {
        isPending: true,
      },
    });
    renderWithProviders(<Home />);

    await searchFor("a");

    await userEvent.click(screen.getByText("Alice"));
    await userEvent.click(screen.getByText("Bob"));
    await userEvent.click(screen.getByText("Charlie"));
    await userEvent.click(screen.getByText("Diana"));
    await userEvent.click(screen.getByText("Eve"));

    const startButton = screen.getByRole("button", { name: "Démarrer la session" });
    expect(startButton).toBeDisabled();
  });

  it("shows error message when mutation fails", () => {
    setupMocks({
      createSession: {
        error: new Error("Network error"),
        isError: true,
      },
    });
    renderWithProviders(<Home />);

    expect(
      screen.getByText("Erreur lors de la création de la session."),
    ).toBeInTheDocument();
  });

  it("renders sessions list section", () => {
    setupMocks();
    renderWithProviders(<Home />);

    expect(screen.getByText("Sessions récentes")).toBeInTheDocument();
  });
});
