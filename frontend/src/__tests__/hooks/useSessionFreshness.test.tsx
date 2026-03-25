import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionFreshness } from "../../hooks/useSessionFreshness";

vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

import { apiFetch } from "../../services/api";

const mockedApiFetch = vi.mocked(apiFetch);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSessionFreshness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches freshness data when enabled", async () => {
    mockedApiFetch.mockResolvedValue({ updatedAt: "2026-03-25T14:00:00+00:00" });

    const { result } = renderHook(() => useSessionFreshness(1, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/sessions/1/freshness");
    expect(result.current.data?.updatedAt).toBe("2026-03-25T14:00:00+00:00");
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useSessionFreshness(1, false), {
      wrapper: createWrapper(),
    });

    expect(mockedApiFetch).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});
