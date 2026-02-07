import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteGameModal from "../../components/DeleteGameModal";
import * as useDeleteGameModule from "../../hooks/useDeleteGame";
import { renderWithProviders } from "../test-utils";
import type { Game } from "../../types/api";

vi.mock("../../hooks/useDeleteGame");

const mockGame: Game = {
  chelem: "none",
  contract: "garde",
  createdAt: "2025-02-01T14:00:00+00:00",
  id: 1,
  oudlers: 2,
  partner: { id: 2, name: "Bob" },
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 56,
  position: 2,
  scoreEntries: [],
  status: "completed",
  taker: { id: 1, name: "Alice" },
};

function setupMock(overrides?: Partial<ReturnType<typeof useDeleteGameModule.useDeleteGame>>) {
  const mutateFn = vi.fn();
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
    mutate: mutateFn,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    status: "idle",
    submittedAt: 0,
    variables: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useDeleteGameModule.useDeleteGame>);
  return { mutateFn };
}

describe("DeleteGameModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders confirmation message and buttons", () => {
    setupMock();
    renderWithProviders(
      <DeleteGameModal game={mockGame} onClose={() => {}} open={true} sessionId={1} />,
    );

    expect(screen.getByText("Supprimer la donne")).toBeInTheDocument();
    expect(screen.getByText(/Êtes-vous sûr/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeInTheDocument();
  });

  it("calls mutate when Supprimer is clicked", async () => {
    const { mutateFn } = setupMock();
    renderWithProviders(
      <DeleteGameModal game={mockGame} onClose={() => {}} open={true} sessionId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(mutateFn).toHaveBeenCalledOnce();
  });

  it("calls onClose when Annuler is clicked", async () => {
    setupMock();
    const onClose = vi.fn();
    renderWithProviders(
      <DeleteGameModal game={mockGame} onClose={onClose} open={true} sessionId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows error message when deletion fails", () => {
    setupMock({
      error: new Error("API error: 500"),
      isError: true,
    });
    renderWithProviders(
      <DeleteGameModal game={mockGame} onClose={() => {}} open={true} sessionId={1} />,
    );

    expect(screen.getByText("API error: 500")).toBeInTheDocument();
  });

  it("disables Supprimer button when pending", () => {
    setupMock({ isPending: true });
    renderWithProviders(
      <DeleteGameModal game={mockGame} onClose={() => {}} open={true} sessionId={1} />,
    );

    expect(screen.getByRole("button", { name: "Supprimer" })).toBeDisabled();
  });

  it("does not render when closed", () => {
    setupMock();
    renderWithProviders(
      <DeleteGameModal game={mockGame} onClose={() => {}} open={false} sessionId={1} />,
    );

    expect(screen.queryByText("Supprimer la donne")).not.toBeInTheDocument();
  });
});
