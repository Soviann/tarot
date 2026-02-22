import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { ThemeProvider, useTheme } from "next-themes";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ThemeProvider, {
    attribute: "class",
    defaultTheme: "light",
    enableSystem: false,
    storageKey: "theme",
    themes: ["light", "dark"],
  }, children);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("class");
  document.documentElement.removeAttribute("style");
});

describe("useTheme (next-themes)", () => {
  it("defaults to light theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.resolvedTheme).toBe("light");
  });

  it("switches to dark theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTheme("dark"));

    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("toggles back to light theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTheme("dark"));
    act(() => result.current.setTheme("light"));

    expect(result.current.resolvedTheme).toBe("light");
  });

  it("persists preference in localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTheme("dark"));

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("reads initial value from localStorage", () => {
    localStorage.setItem("theme", "dark");

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("exposes available themes", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themes).toEqual(["light", "dark"]);
  });

  it("supports callback-based setTheme for toggling", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTheme((prev) => prev === "dark" ? "light" : "dark"));

    expect(result.current.resolvedTheme).toBe("dark");

    act(() => result.current.setTheme((prev) => prev === "dark" ? "light" : "dark"));

    expect(result.current.resolvedTheme).toBe("light");
  });
});
