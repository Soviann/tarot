import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewGameModal from "../../components/NewGameModal";
import type { useCreateGame } from "../../hooks/useCreateGame";
import { renderWithProviders } from "../test-utils";

const mockPlayers = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Diana" },
  { id: 5, name: "Eve" },
];

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

  it("highlights selected contract with ring", async () => {
    const createGame = createMockCreateGame();
    renderWithProviders(
      <NewGameModal createGame={createGame} onClose={vi.fn()} open players={mockPlayers} />,
    );

    const gardeButton = screen.getByRole("button", { name: "Garde" });
    await userEvent.click(gardeButton);

    expect(gardeButton).toHaveClass("ring-2");
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
});
