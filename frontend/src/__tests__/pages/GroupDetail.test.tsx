import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDetail from "../../pages/GroupDetail";
import * as useCloseGroupSessionsModule from "../../hooks/useCloseGroupSessions";
import * as useDeletePlayerGroupModule from "../../hooks/useDeletePlayerGroup";
import * as usePlayerGroupModule from "../../hooks/usePlayerGroup";
import * as useUpdatePlayerGroupModule from "../../hooks/useUpdatePlayerGroup";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useCloseGroupSessions");
vi.mock("../../hooks/useDeletePlayerGroup");
vi.mock("../../hooks/usePlayerGroup");
vi.mock("../../hooks/useUpdatePlayerGroup");

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
  group?: typeof mockGroup | undefined;
  isPending?: boolean;
}) {
  const closeMutate = vi.fn();
  const closeResult = makeMutationResult({ mutate: closeMutate, ...overrides?.closeGroupSessions });

  vi.mocked(usePlayerGroupModule.usePlayerGroup).mockReturnValue({
    group: overrides?.group !== undefined ? overrides.group : mockGroup,
    isPending: overrides?.isPending ?? false,
  } as ReturnType<typeof usePlayerGroupModule.usePlayerGroup>);

  vi.mocked(useCloseGroupSessionsModule.useCloseGroupSessions).mockReturnValue(
    closeResult as unknown as ReturnType<typeof useCloseGroupSessionsModule.useCloseGroupSessions>,
  );

  vi.mocked(useUpdatePlayerGroupModule.useUpdatePlayerGroup).mockReturnValue(
    makeMutationResult() as unknown as ReturnType<typeof useUpdatePlayerGroupModule.useUpdatePlayerGroup>,
  );

  vi.mocked(useDeletePlayerGroupModule.useDeletePlayerGroup).mockReturnValue(
    makeMutationResult() as unknown as ReturnType<typeof useDeletePlayerGroupModule.useDeletePlayerGroup>,
  );

  return { closeMutate };
}

describe("GroupDetail — close sessions modal", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
});
