import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SwapPlayersModal from "../../components/SwapPlayersModal";
import * as useCreatePlayerModule from "../../hooks/useCreatePlayer";
import * as useCreateSessionModule from "../../hooks/useCreateSession";
import * as usePlayersModule from "../../hooks/usePlayers";
import type { Player, Session } from "../../types/api";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useCreatePlayer");
vi.mock("../../hooks/useCreateSession");
vi.mock("../../hooks/usePlayers");

const mockPlayers: Player[] = [
  { active: true, createdAt: "2025-01-01", id: 1, name: "Alice" },
  { active: true, createdAt: "2025-01-01", id: 2, name: "Bob" },
  { active: true, createdAt: "2025-01-01", id: 3, name: "Charlie" },
  { active: true, createdAt: "2025-01-01", id: 4, name: "Diana" },
  { active: true, createdAt: "2025-01-01", id: 5, name: "Eve" },
  { active: true, createdAt: "2025-01-01", id: 6, name: "Frank" },
];

const currentPlayerIds = [1, 2, 3, 4, 5];

function setupMocks(overrides?: {
  createSession?: Partial<ReturnType<typeof useCreateSessionModule.useCreateSession>>;
}) {
  const createSessionMutate = vi.fn();
  const createSessionReset = vi.fn();

  vi.mocked(usePlayersModule.usePlayers).mockReturnValue({
    data: { member: mockPlayers, totalItems: mockPlayers.length },
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
    promise: Promise.resolve({ member: mockPlayers, totalItems: mockPlayers.length }),
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
    reset: createSessionReset,
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides?.createSession,
  } as unknown as ReturnType<typeof useCreateSessionModule.useCreateSession>);

  return { createSessionMutate, createSessionReset };
}

describe("SwapPlayersModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders title when open", () => {
    setupMocks();
    renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={vi.fn()}
        open={true}
      />,
    );

    expect(screen.getByText("Modifier les joueurs")).toBeInTheDocument();
  });

  it("pre-fills PlayerSelector with current players", () => {
    setupMocks();
    renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={vi.fn()}
        open={true}
      />,
    );

    const chips = screen.getByTestId("selected-chips");
    expect(chips).toHaveTextContent("Alice");
    expect(chips).toHaveTextContent("Bob");
    expect(chips).toHaveTextContent("Charlie");
    expect(chips).toHaveTextContent("Diana");
    expect(chips).toHaveTextContent("Eve");
  });

  it("disables Confirmer button when less than 5 players selected", async () => {
    setupMocks();
    renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={vi.fn()}
        open={true}
      />,
    );

    // Remove one player by clicking its chip
    const chips = screen.getByTestId("selected-chips");
    const aliceChip = chips.querySelector("button");
    await userEvent.click(aliceChip!);

    expect(screen.getByRole("button", { name: "Confirmer" })).toBeDisabled();
  });

  it("calls createSession.mutate with selected IDs on confirm", async () => {
    const { createSessionMutate } = setupMocks();
    renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={vi.fn()}
        open={true}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(createSessionMutate).toHaveBeenCalledWith(
      currentPlayerIds,
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("calls onSwap when mutation succeeds", async () => {
    const onSwap = vi.fn();
    const { createSessionMutate } = setupMocks();

    createSessionMutate.mockImplementation(
      (_ids: number[], options: { onSuccess: (s: Session) => void }) => {
        options.onSuccess({ createdAt: "2025-01-01", id: 99, isActive: true, players: [] });
      },
    );

    renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={onSwap}
        open={true}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(onSwap).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99 }),
    );
  });

  it("shows error message when mutation fails", async () => {
    setupMocks({
      createSession: {
        error: new Error("Erreur serveur"),
        isError: true,
      },
    });

    renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={vi.fn()}
        open={true}
      />,
    );

    expect(screen.getByText("Erreur serveur")).toBeInTheDocument();
  });

  it("renders nothing when open is false", () => {
    setupMocks();
    const { container } = renderWithProviders(
      <SwapPlayersModal
        currentPlayerIds={currentPlayerIds}
        onClose={vi.fn()}
        onSwap={vi.fn()}
        open={false}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
