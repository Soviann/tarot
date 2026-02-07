import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { usePlayerStats } from "../../hooks/usePlayerStats";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

const mockPlayerStats = {
  averageScore: 8.6,
  bestGameScore: 240,
  contractDistribution: [
    { contract: "garde", count: 8, winRate: 62.5, wins: 5 },
  ],
  gamesAsDefender: 90,
  gamesAsPartner: 20,
  gamesAsTaker: 35,
  gamesPlayed: 145,
  player: { id: 1, name: "Alice" },
  recentScores: [
    { date: "2026-02-07T12:00:00+00:00", gameId: 150, score: 120, sessionId: 12 },
  ],
  sessionsPlayed: 10,
  winRateAsTaker: 57.1,
  worstGameScore: -360,
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("usePlayerStats", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches player statistics from /statistics/players/:id", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockPlayerStats);

    const { result } = renderHook(() => usePlayerStats(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/statistics/players/1");
    expect(result.current.stats).toEqual(mockPlayerStats);
  });

  it("returns null while loading", () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockPlayerStats);

    const { result } = renderHook(() => usePlayerStats(1), { wrapper });

    expect(result.current.stats).toBeNull();
  });
});
