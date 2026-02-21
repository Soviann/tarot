import { describe, expect, it } from "vitest";
import { queryClient } from "../queryClient";

describe("QueryClient", () => {
  it("configure staleTime à 30 secondes par défaut", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
  });
});
