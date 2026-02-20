import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useReorderPlayers } from "../../hooks/useReorderPlayers";
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

describe("useReorderPlayers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH with playerOrder", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useReorderPlayers(1), { wrapper });

    await act(() => result.current.mutateAsync([3, 1, 5, 2, 4]));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/1", {
      body: JSON.stringify({ playerOrder: [3, 1, 5, 2, 4] }),
      headers: { "Content-Type": "application/merge-patch+json" },
      method: "PATCH",
    });
  });

  it("invalidates session query on success", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue({ id: 1 });
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useReorderPlayers(1), { wrapper });

    await act(() => result.current.mutateAsync([3, 1, 5, 2, 4]));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["session", 1],
    });
  });

  it("propagates API errors", async () => {
    const apiError = new api.ApiError(
      { detail: "Validation error" },
      "API error: 422",
      422,
    );
    vi.mocked(api.apiFetch).mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useReorderPlayers(1), { wrapper });

    act(() => result.current.mutate([99, 98, 97, 96, 95]));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
  });
});
