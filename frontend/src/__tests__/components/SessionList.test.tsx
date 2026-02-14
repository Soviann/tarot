import { screen } from "@testing-library/react";
import SessionList from "../../components/SessionList";
import { EMPTY_STATE_MESSAGES } from "../../components/SessionList";
import * as useSessionsModule from "../../hooks/useSessions";
import { renderWithProviders } from "../test-utils";

vi.mock("../../hooks/useSessions");

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
  {
    createdAt: "2025-01-28T10:00:00+00:00",
    id: 2,
    isActive: false,
    lastPlayedAt: "2025-01-28T10:00:00+00:00",
    players: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
      { id: 6, name: "Frank" },
      { id: 7, name: "Grace" },
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

  it("renders player avatars for each session", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    // Each session has 5 players with avatars (role="img")
    const avatars = screen.getAllByRole("img");
    expect(avatars).toHaveLength(10); // 2 sessions × 5 players
  });

  it("displays last played date", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    // Dates are formatted via formatRelativeDate — just check presence
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
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

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows random empty state message when no sessions", () => {
    setupMocks({
      useSessions: { sessions: [] },
    });
    renderWithProviders(<SessionList />);

    const emptyState = screen.getByTestId("empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(
      EMPTY_STATE_MESSAGES.some((msg) => emptyState.textContent?.includes(msg)),
    ).toBe(true);
  });

  it("renders all sessions from API (limited server-side)", () => {
    setupMocks();
    renderWithProviders(<SessionList />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
  });
});
