import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useCreateGame } from "../../hooks/useCreateGame";
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

describe("useCreateGame", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST to /sessions/{sessionId}/games with contract and taker IRI", async () => {
    const created = { contract: "garde", id: 1, status: "in_progress", taker: { id: 3, name: "Charlie" } };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateGame(42), { wrapper });

    await act(() =>
      result.current.mutateAsync({ contract: "garde", takerId: 3 }),
    );

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/42/games", {
      body: JSON.stringify({
        contract: "garde",
        taker: "/api/players/3",
      }),
      method: "POST",
    });
  });

  it("invalidates session query on success", async () => {
    const created = { contract: "garde", id: 1, status: "in_progress", taker: { id: 3, name: "Charlie" } };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateGame(42), { wrapper });

    await act(() =>
      result.current.mutateAsync({ contract: "garde", takerId: 3 }),
    );

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["session", 42] });
  });

  it("propagates API errors", async () => {
    const apiError = new api.ApiError(
      { detail: "Server error" },
      "API error: 500",
      500,
    );
    vi.mocked(api.apiFetch).mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateGame(42), { wrapper });

    act(() => result.current.mutate({ contract: "garde", takerId: 3 }));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
  });
});
