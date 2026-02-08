import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useUpdatePlayer } from "../../hooks/useUpdatePlayer";
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

describe("useUpdatePlayer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH to /players/{id} with merge-patch+json", async () => {
    const updated = { active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alicia" };
    vi.mocked(api.apiFetch).mockResolvedValue(updated);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdatePlayer(), { wrapper });

    await act(() => result.current.mutateAsync({ id: 1, name: "Alicia" }));

    expect(api.apiFetch).toHaveBeenCalledWith("/players/1", {
      body: JSON.stringify({ name: "Alicia" }),
      headers: { "Content-Type": "application/merge-patch+json" },
      method: "PATCH",
    });
  });

  it("sends only active field when updating active status", async () => {
    const updated = { active: false, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" };
    vi.mocked(api.apiFetch).mockResolvedValue(updated);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdatePlayer(), { wrapper });

    await act(() => result.current.mutateAsync({ active: false, id: 1 }));

    expect(api.apiFetch).toHaveBeenCalledWith("/players/1", {
      body: JSON.stringify({ active: false }),
      headers: { "Content-Type": "application/merge-patch+json" },
      method: "PATCH",
    });
  });

  it("invalidates players query on success", async () => {
    const updated = { active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alicia" };
    vi.mocked(api.apiFetch).mockResolvedValue(updated);
    const { queryClient, wrapper } = createWrapper();

    queryClient.setQueryData(["players"], {
      member: [{ active: true, createdAt: "2025-01-15T10:00:00+00:00", id: 1, name: "Alice" }],
      totalItems: 1,
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdatePlayer(), { wrapper });

    await act(() => result.current.mutateAsync({ id: 1, name: "Alicia" }));

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

    const { result } = renderHook(() => useUpdatePlayer(), { wrapper });

    act(() => result.current.mutate({ id: 1, name: "Alice" }));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
    expect((result.current.error as api.ApiError).status).toBe(422);
  });
});
