import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useAwardKonamiBadge } from "../../hooks/useAwardKonamiBadge";
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

describe("useAwardKonamiBadge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST to /players/{id}/konami", async () => {
    const badge = { description: "", emoji: "🕹️", label: "", type: "konami", unlockedAt: "2026-02-21T10:00:00+00:00" };
    vi.mocked(api.apiFetch).mockResolvedValue({ badge, newBadges: [] });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAwardKonamiBadge(42), { wrapper });

    await act(() => result.current.mutateAsync(undefined));

    expect(api.apiFetch).toHaveBeenCalledWith("/players/42/konami", {
      method: "POST",
    });
  });

  it("invalidates playerStats query on success", async () => {
    const badge = { description: "", emoji: "🕹️", label: "", type: "konami", unlockedAt: "2026-02-21T10:00:00+00:00" };
    vi.mocked(api.apiFetch).mockResolvedValue({ badge, newBadges: [] });
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAwardKonamiBadge(42), { wrapper });

    await act(() => result.current.mutateAsync(undefined));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["playerStats", 42] });
  });

  it("returns null when badge was already awarded", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(null);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAwardKonamiBadge(42), { wrapper });

    await act(() => result.current.mutateAsync(undefined));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBeNull();
  });
});
