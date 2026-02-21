import { describe, expect, it } from "vitest";
import { queryClient } from "../App";

describe("App QueryClient", () => {
  it("configure staleTime à 30 secondes par défaut", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
  });
});
