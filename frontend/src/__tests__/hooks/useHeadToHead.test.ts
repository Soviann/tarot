import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useHeadToHead } from "../../hooks/useHeadToHead";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => ({
  ...(await importOriginal()),
  apiFetch: vi.fn(),
}));

const mockData = {
  player1: {
    averageScore: 25.5,
    calledOtherAsPartner: 2,
    gamesAsTaker: 5,
    gamesAsTakerVsOtherAsDefender: 3,
    playerColor: "#ff0000",
    playerId: 1,
    playerName: "Alice",
    totalScore: 510,
    winsAsTaker: 3,
    winsAsTakerVsOtherAsDefender: 2,
  },
  player2: {
    averageScore: -12.3,
    calledOtherAsPartner: 1,
    gamesAsTaker: 4,
    gamesAsTakerVsOtherAsDefender: 2,
    playerColor: "#0000ff",
    playerId: 2,
    playerName: "Bob",
    totalScore: -246,
    winsAsTaker: 2,
    winsAsTakerVsOtherAsDefender: 1,
  },
  sharedGames: 10,
  sharedSessions: 3,
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useHeadToHead", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches head-to-head stats with both player IDs", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockData);

    const { result } = renderHook(() => useHeadToHead(1, 2), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith(
      "/statistics/head-to-head?player1=1&player2=2",
    );
    expect(result.current.stats).toEqual(mockData);
  });

  it("returns null while loading", () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockData);

    const { result } = renderHook(() => useHeadToHead(1, 2), { wrapper });

    expect(result.current.stats).toBeNull();
  });

  it("is disabled when player1Id is undefined", () => {
    const { result } = renderHook(() => useHeadToHead(undefined, 2), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when player2Id is undefined", () => {
    const { result } = renderHook(() => useHeadToHead(1, undefined), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when both IDs are the same", () => {
    const { result } = renderHook(() => useHeadToHead(1, 1), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("appends date and group query params", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useHeadToHead(1, 2, 5, "2026-01-01", "2026-02-27"),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith(
      "/statistics/head-to-head?from=2026-01-01&player1=1&player2=2&playerGroup=5&to=2026-02-27",
    );
  });
});
