import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useSessionSummary } from "../../hooks/useSessionSummary";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return { ...actual, apiFetch: vi.fn() };
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockSummary = {
  awards: [
    {
      description: "A infligé le plus de points",
      playerColor: null,
      playerId: 1,
      playerName: "Alice",
      title: "Le Boucher",
    },
  ],
  highlights: {
    bestGame: { contract: "garde", gameId: 1, playerName: "Alice", score: 180 },
    duration: 3600,
    lastPlace: { playerId: 2, playerName: "Bob", score: -100 },
    mostPlayedContract: { contract: "garde", count: 5 },
    mvp: { playerId: 1, playerName: "Alice", score: 200 },
    totalGames: 10,
    totalStars: 3,
    worstGame: { contract: "petite", gameId: 2, playerName: "Bob", score: -50 },
  },
  ranking: [
    { playerColor: null, playerId: 1, playerName: "Alice", position: 1, score: 200 },
    { playerColor: null, playerId: 2, playerName: "Bob", position: 2, score: -100 },
  ],
  scoreSpread: 300,
};

describe("useSessionSummary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches summary from /sessions/{id}/summary", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useSessionSummary(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/1/summary");
    expect(result.current.data).toEqual(mockSummary);
  });

  it("returns undefined while loading", () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useSessionSummary(1), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(true);
  });
});
