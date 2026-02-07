import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useCompleteGame } from "../../hooks/useCompleteGame";
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

describe("useCompleteGame", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends PATCH with merge-patch+json content type", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue({ id: 7, status: "completed" });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCompleteGame(7, 42), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        chelem: "none",
        oudlers: 2,
        partnerId: 3,
        petitAuBout: "none",
        poignee: "none",
        poigneeOwner: "none",
        points: 45,
        status: "completed",
      }),
    );

    expect(api.apiFetch).toHaveBeenCalledWith("/games/7", {
      body: JSON.stringify({
        chelem: "none",
        oudlers: 2,
        partner: "/api/players/3",
        petitAuBout: "none",
        poignee: "none",
        poigneeOwner: "none",
        points: 45,
        status: "completed",
      }),
      headers: { "Content-Type": "application/merge-patch+json" },
      method: "PATCH",
    });
  });

  it("sends partner as null for self-call", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue({ id: 7, status: "completed" });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCompleteGame(7, 42), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        chelem: "none",
        oudlers: 1,
        partnerId: null,
        petitAuBout: "none",
        poignee: "none",
        poigneeOwner: "none",
        points: 60,
        status: "completed",
      }),
    );

    const callArgs = vi.mocked(api.apiFetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]!.body as string);
    expect(body.partner).toBeNull();
  });

  it("invalidates session query on success", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue({ id: 7, status: "completed" });
    const { queryClient, wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCompleteGame(7, 42), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        chelem: "none",
        oudlers: 2,
        partnerId: 3,
        petitAuBout: "none",
        poignee: "none",
        poigneeOwner: "none",
        points: 45,
        status: "completed",
      }),
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

    const { result } = renderHook(() => useCompleteGame(7, 42), { wrapper });

    act(() =>
      result.current.mutate({
        chelem: "none",
        oudlers: 2,
        partnerId: 3,
        petitAuBout: "none",
        poignee: "none",
        poigneeOwner: "none",
        points: 45,
        status: "completed",
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(api.ApiError);
    });
  });
});
