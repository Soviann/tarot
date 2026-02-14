import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useCloseSession } from "../../hooks/useCloseSession";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof api>();
  return { ...actual, apiFetch: vi.fn() };
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  const w = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper: w };
}

const mockSession = {
  createdAt: "2025-02-01T14:00:00+00:00",
  cumulativeScores: [],
  currentDealer: null,
  id: 1,
  isActive: false,
  playerGroup: null,
  players: [],
  starEvents: [],
};

describe("useCloseSession", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH to /sessions/{id} with isActive and merge-patch content type", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockSession);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCloseSession(1), { wrapper });

    await act(() => result.current.mutateAsync(false));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/1", {
      body: JSON.stringify({ isActive: false }),
      headers: { "Content-Type": "application/merge-patch+json" },
      method: "PATCH",
    });
  });

  it("invalidates session and sessions queries on success", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockSession);
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCloseSession(1), { wrapper });

    await act(() => result.current.mutateAsync(false));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["session", 1] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["sessions"] });
  });

  it("propagates API errors", async () => {
    const apiError = new api.ApiError(
      { detail: "Server error" },
      "API error: 500",
      500,
    );
    vi.mocked(api.apiFetch).mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCloseSession(1), { wrapper });

    act(() => result.current.mutate(false));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
  });
});
