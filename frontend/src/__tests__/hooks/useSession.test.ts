import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useSession } from "../../hooks/useSession";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api");

const mockSession = {
  createdAt: "2025-02-01T14:00:00+00:00",
  cumulativeScores: [
    { playerId: 1, playerName: "Alice", score: 120 },
    { playerId: 2, playerName: "Bob", score: -30 },
  ],
  games: [],
  id: 1,
  isActive: true,
  players: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
    { id: 5, name: "Eve" },
  ],
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useSession", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches session from /sessions/{id}", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/1");
    expect(result.current.session).toEqual(mockSession);
  });

  it("returns null while loading", () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockSession);

    const { result } = renderHook(() => useSession(1), { wrapper });

    expect(result.current.session).toBeNull();
  });
});
