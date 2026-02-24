import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetail from "../../pages/GroupDetail";
import * as useCloseGroupSessionsModule from "../../hooks/useCloseGroupSessions";
import * as useDeletePlayerGroupModule from "../../hooks/useDeletePlayerGroup";
import * as usePlayerGroupModule from "../../hooks/usePlayerGroup";
import * as useUpdatePlayerGroupModule from "../../hooks/useUpdatePlayerGroup";
import { ApiError } from "../../services/api";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useCloseGroupSessions");
vi.mock("../../hooks/useDeletePlayerGroup");
vi.mock("../../hooks/usePlayerGroup");
vi.mock("../../hooks/useUpdatePlayerGroup");
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "1" }),
  };
});

const mockGroup = {
  id: 1,
  name: "Groupe A",
  players: [
    { color: null, id: 1, name: "Alice" },
    { color: null, id: 2, name: "Bob" },
  ],
};

function makeMutationResult(overrides?: Record<string, unknown>) {
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
    status: "idle" as const,
    submittedAt: 0,
    variables: undefined,
    ...overrides,
  };
}

function setupMocks(overrides?: {
  closeGroupSessions?: Record<string, unknown>;
  deleteGroup?: Record<string, unknown>;
  group?: typeof mockGroup | null;
  isPending?: boolean;
  updateGroup?: Record<string, unknown>;
}) {
  const closeMutate = vi.fn();
  const updateMutate = vi.fn();
  const deleteMutate = vi.fn();
  const closeResult = makeMutationResult({ mutate: closeMutate, ...overrides?.closeGroupSessions });
  const updateResult = makeMutationResult({ mutate: updateMutate, ...overrides?.updateGroup });
  const deleteResult = makeMutationResult({ mutate: deleteMutate, ...overrides?.deleteGroup });

  vi.mocked(usePlayerGroupModule.usePlayerGroup).mockReturnValue({
    group: overrides?.group !== undefined ? overrides.group : mockGroup,
    isPending: overrides?.isPending ?? false,
  } as ReturnType<typeof usePlayerGroupModule.usePlayerGroup>);

  vi.mocked(useCloseGroupSessionsModule.useCloseGroupSessions).mockReturnValue(
    closeResult as unknown as ReturnType<typeof useCloseGroupSessionsModule.useCloseGroupSessions>,
  );

  vi.mocked(useUpdatePlayerGroupModule.useUpdatePlayerGroup).mockReturnValue(
    updateResult as unknown as ReturnType<typeof useUpdatePlayerGroupModule.useUpdatePlayerGroup>,
  );

  vi.mocked(useDeletePlayerGroupModule.useDeletePlayerGroup).mockReturnValue(
    deleteResult as unknown as ReturnType<typeof useDeletePlayerGroupModule.useDeletePlayerGroup>,
  );

  return { closeMutate, deleteMutate, updateMutate };
}

describe("GroupDetail", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows NotFound when group is null", () => {
    setupMocks({ group: null });
    renderWithProviders(<GroupDetail />);

    expect(screen.getByRole("heading", { level: 1, name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
  });

  it("opens a confirmation modal when clicking 'Clôturer les sessions'", async () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /clôturer les sessions/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Clôturer les sessions");
    expect(dialog).toHaveTextContent(/clôturer toutes les sessions ouvertes/i);
  });

  it("closes the modal when clicking 'Annuler'", async () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /clôturer les sessions/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("calls closeGroupSessions.mutate when confirming", async () => {
    const { closeMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /clôturer les sessions/i }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(closeMutate).toHaveBeenCalledWith(1, expect.anything());
  });

  it("does not call mutate if modal is cancelled", async () => {
    const { closeMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /clôturer les sessions/i }));
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(closeMutate).not.toHaveBeenCalled();
  });

  it("shows spinner when loading", () => {
    setupMocks({ isPending: true });
    renderWithProviders(<GroupDetail />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays the group name in a heading", () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    expect(screen.getByRole("heading", { level: 1, name: "Groupe A" })).toBeInTheDocument();
  });

  it("displays the member count", () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    expect(screen.getByText("Membres (2)")).toBeInTheDocument();
  });

  it("displays each player with their avatar", () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Bob" })).toBeInTheDocument();
  });

  it("shows edit form when clicking edit name button", async () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: "Modifier le nom" }));

    expect(screen.getByDisplayValue("Groupe A")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Valider" })).toBeInTheDocument();
  });

  it("calls updateGroup.mutate when submitting a new name", async () => {
    const { updateMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: "Modifier le nom" }));
    const input = screen.getByDisplayValue("Groupe A");
    await userEvent.clear(input);
    await userEvent.type(input, "Nouveau nom");
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(updateMutate).toHaveBeenCalledWith({ id: 1, name: "Nouveau nom" }, expect.anything());
  });

  it("does not call updateGroup.mutate when submitting empty name", async () => {
    const { updateMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: "Modifier le nom" }));
    const input = screen.getByDisplayValue("Groupe A");
    await userEvent.clear(input);
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("shows duplicate name error when update returns 422", () => {
    setupMocks({
      updateGroup: {
        error: new ApiError(null, "422: duplicate", 422),
        isError: true,
      },
    });
    renderWithProviders(<GroupDetail />);

    expect(screen.getByText("Ce nom est déjà utilisé.")).toBeInTheDocument();
  });

  it("opens the add members modal", async () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /ajouter/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Gérer les membres")).toBeInTheDocument();
  });

  it("calls updateGroup.mutate when saving members", async () => {
    const { updateMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(updateMutate).toHaveBeenCalledWith(
      { id: 1, players: ["/api/players/1", "/api/players/2"] },
      expect.anything(),
    );
  });

  it("calls updateGroup.mutate to remove a player", async () => {
    const { updateMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: "Retirer Alice" }));

    expect(updateMutate).toHaveBeenCalledWith(
      { id: 1, players: ["/api/players/2"] },
      expect.anything(),
    );
  });

  it("opens the delete group modal", async () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /supprimer le groupe/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Supprimer le groupe");
  });

  it("calls deleteGroup.mutate when confirming deletion", async () => {
    const { deleteMutate } = setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /supprimer le groupe/i }));
    const dialog = screen.getByRole("dialog");
    const confirmButton = Array.from(dialog.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Supprimer",
    )!;
    await userEvent.click(confirmButton);

    expect(deleteMutate).toHaveBeenCalledWith(1, expect.anything());
  });

  it("closes the delete modal when clicking cancel", async () => {
    setupMocks();
    renderWithProviders(<GroupDetail />);

    await userEvent.click(screen.getByRole("button", { name: /supprimer le groupe/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when group has no players", () => {
    setupMocks({ group: { ...mockGroup, players: [] } });
    renderWithProviders(<GroupDetail />);

    expect(screen.getByText("Aucun membre dans ce groupe")).toBeInTheDocument();
  });
});
