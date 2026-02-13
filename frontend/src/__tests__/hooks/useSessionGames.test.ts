import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useSessionGames } from "../../hooks/useSessionGames";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api", async (importOriginal) => ({
  ...await importOriginal(),
  apiFetch: vi.fn(),
}));

const mockPage1 = {
  member: Array.from({ length: 10 }, (_, i) => ({
    chelem: "none",
    completedAt: "2025-02-01T14:05:00+00:00",
    contract: "petite",
    createdAt: "2025-02-01T14:00:00+00:00",
    dealer: null,
    id: 10 - i,
    oudlers: 2,
    partner: null,
    petitAuBout: "none",
    poignee: "none",
    poigneeOwner: "none",
    points: 45,
    position: 10 - i,
    scoreEntries: [],
    status: "completed",
    taker: { id: 1, name: "Alice" },
  })),
  totalItems: 12,
};

const mockPage2 = {
  member: [
    {
      chelem: "none",
      completedAt: "2025-02-01T14:05:00+00:00",
      contract: "garde",
      createdAt: "2025-02-01T14:00:00+00:00",
      dealer: null,
      id: 12,
      oudlers: 1,
      partner: null,
      petitAuBout: "none",
      poignee: "none",
      poigneeOwner: "none",
      points: 50,
      position: 12,
      scoreEntries: [],
      status: "completed",
      taker: { id: 2, name: "Bob" },
    },
    {
      chelem: "none",
      completedAt: "2025-02-01T14:05:00+00:00",
      contract: "petite",
      createdAt: "2025-02-01T14:00:00+00:00",
      dealer: null,
      id: 11,
      oudlers: 2,
      partner: null,
      petitAuBout: "none",
      poignee: "none",
      poigneeOwner: "none",
      points: 45,
      position: 11,
      scoreEntries: [],
      status: "completed",
      taker: { id: 1, name: "Alice" },
    },
  ],
  totalItems: 12,
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useSessionGames", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches first page of games", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockPage1);

    const { result } = renderHook(() => useSessionGames(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/1/games?page=1");
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0].member).toHaveLength(10);
  });

  it("has next page when totalItems > loaded items", async () => {
    vi.mocked(api.apiFetch).mockResolvedValue(mockPage1);

    const { result } = renderHook(() => useSessionGames(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);
  });

  it("fetches next page", async () => {
    vi.mocked(api.apiFetch)
      .mockResolvedValueOnce(mockPage1)
      .mockResolvedValueOnce(mockPage2);

    const { result } = renderHook(() => useSessionGames(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions/1/games?page=2");
    expect(result.current.data?.pages[1].member).toHaveLength(2);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("has no next page when all items loaded", async () => {
    const singlePage = { ...mockPage1, totalItems: 10 };
    vi.mocked(api.apiFetch).mockResolvedValue(singlePage);

    const { result } = renderHook(() => useSessionGames(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });
});
