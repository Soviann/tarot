import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { useSessions } from "../../hooks/useSessions";
import * as api from "../../services/api";
import { createTestQueryClient } from "../test-utils";

vi.mock("../../services/api");

const mockSessions = [
  {
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
  },
  {
    createdAt: "2025-01-28T10:00:00+00:00",
    id: 2,
    isActive: false,
    players: [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Charlie" },
      { name: "Frank" },
      { name: "Grace" },
    ],
  },
];

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useSessions", () => {
  beforeEach(() => {
    vi.mocked(api.apiFetch).mockResolvedValue({
      member: mockSessions,
      totalItems: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches sessions from /sessions", async () => {
    const { result } = renderHook(() => useSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.apiFetch).toHaveBeenCalledWith("/sessions");
    expect(result.current.sessions).toEqual(mockSessions);
  });

  it("returns empty array while loading", () => {
    const { result } = renderHook(() => useSessions(), { wrapper });

    expect(result.current.sessions).toEqual([]);
  });
});
