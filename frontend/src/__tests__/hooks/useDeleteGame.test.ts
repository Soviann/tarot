import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useDeleteGame } from "../../hooks/useDeleteGame";
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

describe("useDeleteGame", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends DELETE request to correct URL", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(undefined);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteGame(7, 42), { wrapper });

    await act(() => result.current.mutateAsync());

    expect(api.apiFetch).toHaveBeenCalledWith("/games/7", {
      method: "DELETE",
    });
  });

  it("invalidates session query on success", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteGame(7, 42), { wrapper });

    await act(() => result.current.mutateAsync());

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

    const { result } = renderHook(() => useDeleteGame(7, 42), { wrapper });

    act(() => result.current.mutate());

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
  });
});
