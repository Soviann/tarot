import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useCreateSession } from "../../hooks/useCreateSession";
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

describe("useCreateSession", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST to /sessions with player IRIs", async () => {
    const created = {
      createdAt: "2025-02-01T14:00:00+00:00",
      id: 1,
      isActive: true,
      players: [
        { name: "Alice" },
        { name: "Bob" },
        { name: "Charlie" },
        { name: "Diana" },
        { name: "Eve" },
      ],
    };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateSession(), { wrapper });

    await act(() => result.current.mutateAsync([1, 2, 3, 4, 5]));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions", {
      body: JSON.stringify({
        players: [
          "/api/players/1",
          "/api/players/2",
          "/api/players/3",
          "/api/players/4",
          "/api/players/5",
        ],
      }),
      method: "POST",
    });
  });

  it("invalidates sessions query on success", async () => {
    const created = {
      createdAt: "2025-02-01T14:00:00+00:00",
      id: 1,
      isActive: true,
      players: [{ name: "Alice" }],
    };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateSession(), { wrapper });

    await act(() => result.current.mutateAsync([1, 2, 3, 4, 5]));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["sessions"] });
  });

  it("returns the created session", async () => {
    const created = {
      createdAt: "2025-02-01T14:00:00+00:00",
      id: 42,
      isActive: true,
      players: [],
    };
    vi.mocked(api.apiFetch).mockResolvedValue(created);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateSession(), { wrapper });

    const session = await act(() => result.current.mutateAsync([1, 2, 3, 4, 5]));

    expect(session.id).toBe(42);
  });

  it("propagates API errors", async () => {
    const apiError = new api.ApiError(
      { detail: "Server error" },
      "API error: 500",
      500,
    );
    vi.mocked(api.apiFetch).mockRejectedValue(apiError);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateSession(), { wrapper });

    act(() => result.current.mutate([1, 2, 3, 4, 5]));

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
  });
});
