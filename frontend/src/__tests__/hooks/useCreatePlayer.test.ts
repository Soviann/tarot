import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useCreatePlayer } from "../../hooks/useCreatePlayer";
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

describe("useCreatePlayer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST to /players with the given name", async () => {
    const created = { active: true, createdAt: "2025-01-20T10:00:00+00:00", id: 4, name: "Diana" };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    await act(() => result.current.mutateAsync("Diana"));

    expect(api.apiFetch).toHaveBeenCalledWith("/players", {
      body: JSON.stringify({ name: "Diana" }),
      method: "POST",
    });
  });

  it("invalidates players query on success", async () => {
    const created = { active: true, createdAt: "2025-01-20T10:00:00+00:00", id: 4, name: "Diana" };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();

    // Seed the players cache
    queryClient.setQueryData(["players"], {
      member: [{ active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" }],
      totalItems: 1,
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    await act(() => result.current.mutateAsync("Diana"));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["players"] });
  });

  it("propagates ApiError on 422 (duplicate name)", async () => {
    const apiError = new api.ApiError(
      { detail: "name: Cette valeur est déjà utilisée.", title: "An error occurred" },
      "API error: 422",
      422,
    );
    vi.mocked(api.apiFetch).mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreatePlayer(), { wrapper });

    act(() => result.current.mutate("Alice"));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
    expect((result.current.error as api.ApiError).status).toBe(422);
  });
});
