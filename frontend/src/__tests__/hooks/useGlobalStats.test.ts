import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useGlobalStats } from "../../hooks/useGlobalStats";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

const mockStats = {
  contractDistribution: [
    { contract: "petite", count: 5, percentage: 50.0 },
    { contract: "garde", count: 5, percentage: 50.0 },
  ],
  leaderboard: [
    {
      gamesAsTaker: 3,
      gamesPlayed: 10,
      playerId: 1,
      playerName: "Alice",
      totalScore: 250,
      winRate: 66.7,
      wins: 2,
    },
  ],
  totalGames: 10,
  totalSessions: 2,
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useGlobalStats", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches global statistics from /statistics", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useGlobalStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/statistics");
    expect(result.current.stats).toEqual(mockStats);
  });

  it("returns null while loading", () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useGlobalStats(), { wrapper });

    expect(result.current.stats).toBeNull();
  });

  it("appends from and to query params when provided", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockStats);

    const { result } = renderHook(
      () => useGlobalStats(null, "2026-01-01", "2026-02-21"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith(
      "/statistics?from=2026-01-01&to=2026-02-21",
    );
  });

  it("appends from/to together with playerGroup", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockStats);

    const { result } = renderHook(
      () => useGlobalStats(5, "2026-01-01", "2026-02-21"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith(
      "/statistics?from=2026-01-01&playerGroup=5&to=2026-02-21",
    );
  });

  it("appends only from when to is null", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockStats);

    const { result } = renderHook(
      () => useGlobalStats(null, "2026-01-01", null),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith(
      "/statistics?from=2026-01-01",
    );
  });
});
