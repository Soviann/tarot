import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Players from "../../pages/Players";
import * as useCreatePlayerModule from "../../hooks/useCreatePlayer";
import * as usePlayersModule from "../../hooks/usePlayers";
import { ApiError } from "../../services/api";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/usePlayers");
vi.mock("../../hooks/useCreatePlayer");

const mockPlayers = [
  { createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" },
  { createdAt: "2025-01-16T10:00:00+00:00", id: 2, name: "Bob" },
  { createdAt: "2025-01-17T10:00:00+00:00", id: 3, name: "Charlie" },
];

function setupMocks(overrides?: {
  createPlayer?: Partial<ReturnType<typeof useCreatePlayerModule.useCreatePlayer>>;
  usePlayers?: Partial<ReturnType<typeof usePlayersModule.usePlayers>>;
}) {
  const mutate = vi.fn();
  const reset = vi.fn();

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
    mutate,
    mutateAsync: vi.fn(),
    reset,
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides?.createPlayer,
  } as unknown as ReturnType<typeof useCreatePlayerModule.useCreatePlayer>);

  return { mutate, reset };
}

describe("Players page", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders player list with avatars and names", () => {
    setupMocks();
    renderWithProviders(<Players />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    // Avatars
    expect(screen.getByRole("img", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Bob" })).toBeInTheDocument();
  });

  it("displays player count in header", () => {
    setupMocks();
    renderWithProviders(<Players />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("passes search term to usePlayers", async () => {
    setupMocks();
    renderWithProviders(<Players />);

    const searchInput = screen.getByPlaceholderText("Rechercher un joueur…");
    await userEvent.type(searchInput, "ali");

    await waitFor(() => {
      expect(usePlayersModule.usePlayers).toHaveBeenCalledWith("ali");
    });
  });

  it("shows FAB to add a player", () => {
    setupMocks();
    renderWithProviders(<Players />);

    expect(screen.getByRole("button", { name: "Ajouter un joueur" })).toBeInTheDocument();
  });

  it("opens modal when FAB is clicked", async () => {
    setupMocks();
    renderWithProviders(<Players />);

    await userEvent.click(screen.getByRole("button", { name: "Ajouter un joueur" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Nouveau joueur")).toBeInTheDocument();
  });

  it("calls mutate with name on form submission", async () => {
    const { mutate } = setupMocks();
    renderWithProviders(<Players />);

    await userEvent.click(screen.getByRole("button", { name: "Ajouter un joueur" }));
    await userEvent.type(screen.getByPlaceholderText("Nom du joueur"), "Diana");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(mutate).toHaveBeenCalledWith("Diana", expect.anything());
  });

  it("shows error message on duplicate name", async () => {
    const apiError = new ApiError(
      { detail: "name: Cette valeur est déjà utilisée." },
      "API error: 422",
      422,
    );
    setupMocks({
      createPlayer: { error: apiError, isError: true },
    });
    renderWithProviders(<Players />);

    // Open the modal
    await userEvent.click(screen.getByRole("button", { name: "Ajouter un joueur" }));

    expect(screen.getByText("Ce nom est déjà utilisé.")).toBeInTheDocument();
  });

  it("displays empty state when no players", () => {
    setupMocks({ usePlayers: { players: [] } });
    renderWithProviders(<Players />);

    expect(screen.getByText("Aucun joueur trouvé")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    setupMocks({
      usePlayers: { isLoading: true, isPending: true, players: [] },
    });
    renderWithProviders(<Players />);

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });
});
