import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createElement } from "react";
import { usePlayers } from "../../hooks/usePlayers";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api");

const mockPlayers = [
  { createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" },
  { createdAt: "2025-01-16T10:00:00+00:00", id: 2, name: "Bob" },
  { createdAt: "2025-01-17T10:00:00+00:00", id: 3, name: "Charlie" },
];

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("usePlayers", () => {
  beforeEach(() => {
    vi.mocked(api.apiFetch).mockResolvedValue({
      member: mockPlayers,
      totalItems: 3,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches players from /players", async () => {
    const { result } = renderHook(() => usePlayers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/players");
    expect(result.current.players).toEqual(mockPlayers);
  });

  it("filters players by search term (case-insensitive)", async () => {
    const { result } = renderHook(() => usePlayers("ali"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.players).toEqual([mockPlayers[0]]);
  });

  it("returns empty array when search matches nothing", async () => {
    const { result } = renderHook(() => usePlayers("xyz"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.players).toEqual([]);
  });

  it("returns all players when search is empty string", async () => {
    const { result } = renderHook(() => usePlayers(""), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.players).toEqual(mockPlayers);
  });
});
