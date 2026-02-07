import { screen } from "@testing-library/react";
import SessionList from "../../components/SessionList";
import * as useSessionsModule from "../../hooks/useSessions";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useSessions");

const mockSessions = [
  {
    createdAt: "2025-02-01T14:00:00+00:00",
    id: 1,
    isActive: true,
    players: [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
      { name: "Diana" },
      { name: "Eve" },
    ],
  },
  {
    createdAt: "2025-01-28T10:00:00+00:00",
    id: 2,
    isActive: false,
    players: [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
      { name: "Frank" },
      { name: "Grace" },
    ],
  },
];

function setupMocks(overrides?: {
  useSessions?: Partial<ReturnType<typeof useSessionsModule.useSessions>>;
}) {
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
}

describe("SessionList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders session cards with player names", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    expect(
      screen.getByText("Alice, Bob, Charlie, Diana, Eve"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alice, Bob, Charlie, Frank, Grace"),
    ).toBeInTheDocument();
  });

  it("displays formatted dates in fr-FR", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    // 2025-02-01 should be formatted as French date
    expect(screen.getByText("01/02/2025")).toBeInTheDocument();
    expect(screen.getByText("28/01/2025")).toBeInTheDocument();
  });

  it("shows 'En cours' badge for active sessions", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    const badges = screen.getAllByText("En cours");
    expect(badges).toHaveLength(1);
  });

  it("renders links to session pages", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/sessions/1");
    expect(links[1]).toHaveAttribute("href", "/sessions/2");
  });

  it("shows loading state", () => {
    setupMocks({
      useSessions: { isPending: true, sessions: [] },
    });
    renderWithProviders(<SessionList />);

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("shows empty state when no sessions", () => {
    setupMocks({
      useSessions: { sessions: [] },
    });
    renderWithProviders(<SessionList />);

    expect(screen.getByText("Aucune session")).toBeInTheDocument();
  });
});
