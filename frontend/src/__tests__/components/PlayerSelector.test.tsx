import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlayerSelector from "../../components/PlayerSelector";
import * as useCreatePlayerModule from "../../hooks/useCreatePlayer";
import * as usePlayersModule from "../../hooks/usePlayers";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/usePlayers");
vi.mock("../../hooks/useCreatePlayer");

const mockPlayers = [
  { active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" },
  { active: true, createdAt: "2025-01-16T10:00:00+00:00", id: 2, name: "Bob" },
  { active: true, createdAt: "2025-01-17T10:00:00+00:00", id: 3, name: "Charlie" },
  { active: true, createdAt: "2025-01-18T10:00:00+00:00", id: 4, name: "Diana" },
  { active: true, createdAt: "2025-01-19T10:00:00+00:00", id: 5, name: "Eve" },
  { active: true, createdAt: "2025-01-20T10:00:00+00:00", id: 6, name: "Frank" },
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

async function searchFor(text: string) {
  const searchInput = screen.getByPlaceholderText("Rechercher un joueur…");
  await userEvent.type(searchInput, text);
  await waitFor(() => {
    expect(usePlayersModule.usePlayers).toHaveBeenCalledWith(text);
  });
}

describe("PlayerSelector", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not render player list without search", () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("renders player list when searching", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    await searchFor("a");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Frank")).toBeInTheDocument();
  });

  it("displays selection count", () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[1, 2]} />,
    );

    expect(screen.getByText("2/5 joueurs sélectionnés")).toBeInTheDocument();
  });

  it("calls onSelectionChange when a player is clicked to select", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    await searchFor("a");
    await userEvent.click(screen.getByText("Alice"));

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it("calls onSelectionChange when a player is clicked to deselect", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[1, 2]} />,
    );

    await searchFor("a");

    // Click Alice in the player list (not the chip) — get all "Alice" texts, the last one is in the list
    const allAlice = screen.getAllByText("Alice");
    await userEvent.click(allAlice[allAlice.length - 1]);

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("disables unselected players when 5 are already selected", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector
        onSelectionChange={onChange}
        selectedPlayerIds={[1, 2, 3, 4, 5]}
      />,
    );

    await searchFor("a");

    // Frank (id=6) should be disabled
    const frankButton = screen.getByText("Frank").closest("button");
    expect(frankButton).toBeDisabled();
  });

  it("allows deselecting when 5 are selected", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector
        onSelectionChange={onChange}
        selectedPlayerIds={[1, 2, 3, 4, 5]}
      />,
    );

    await searchFor("a");

    // Click Alice in the player list (not the chip)
    const allAlice = screen.getAllByText("Alice");
    await userEvent.click(allAlice[allAlice.length - 1]);

    expect(onChange).toHaveBeenCalledWith([2, 3, 4, 5]);
  });

  it("shows selected player chips at the top", () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[1, 3]} />,
    );

    // Should have avatars for selected players in chips area
    const chipArea = screen.getByTestId("selected-chips");
    expect(chipArea).toBeInTheDocument();
  });

  it("deselects player when chip is clicked", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[1, 2]} />,
    );

    const chipArea = screen.getByTestId("selected-chips");
    const removeButtons = chipArea.querySelectorAll("button");
    // Click the first chip (Alice)
    await userEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("passes search term to usePlayers", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    const searchInput = screen.getByPlaceholderText("Rechercher un joueur…");
    await userEvent.type(searchInput, "ali");

    await waitFor(() => {
      expect(usePlayersModule.usePlayers).toHaveBeenCalledWith("ali");
    });
  });

  it("shows create player button", () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    expect(
      screen.getByRole("button", { name: "Ajouter un joueur" }),
    ).toBeInTheDocument();
  });

  it("opens modal when create button is clicked", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Ajouter un joueur" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nom du joueur")).toBeInTheDocument();
  });

  it("pre-fills new player name with search text", async () => {
    setupMocks();
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    const searchInput = screen.getByPlaceholderText("Rechercher un joueur…");
    await userEvent.type(searchInput, "Nico");

    // Wait for debounced search to propagate
    await waitFor(() => {
      expect(usePlayersModule.usePlayers).toHaveBeenCalledWith("Nico");
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Ajouter un joueur" }),
    );

    expect(screen.getByPlaceholderText("Nom du joueur")).toHaveValue("Nico");
  });

  it("shows loading state when searching", async () => {
    setupMocks({
      usePlayers: { isPending: true, players: [] },
    });
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    await searchFor("a");

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("hides inactive players from selection list", async () => {
    const playersWithInactive = [
      { active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" },
      { active: false, createdAt: "2025-01-16T10:00:00+00:00", id: 2, name: "Bob" },
      { active: true, createdAt: "2025-01-17T10:00:00+00:00", id: 3, name: "Charlie" },
    ];
    setupMocks({
      usePlayers: { data: playersWithInactive, players: playersWithInactive },
    });
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[]} />,
    );

    await searchFor("a");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("shows inactive player in chips if already selected", () => {
    const playersWithInactive = [
      { active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" },
      { active: false, createdAt: "2025-01-16T10:00:00+00:00", id: 2, name: "Bob" },
      { active: true, createdAt: "2025-01-17T10:00:00+00:00", id: 3, name: "Charlie" },
    ];
    setupMocks({
      usePlayers: { data: playersWithInactive, players: playersWithInactive },
    });
    const onChange = vi.fn();
    renderWithProviders(
      <PlayerSelector onSelectionChange={onChange} selectedPlayerIds={[2]} />,
    );

    // Bob should appear in chips (selected) but not in the list
    const chipArea = screen.getByTestId("selected-chips");
    expect(chipArea).toHaveTextContent("Bob");
  });
});
