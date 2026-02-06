import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { ThemeProvider, useTheme } from "../../hooks/useTheme";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ThemeProvider, null, children);
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("useTheme", () => {
  it("defaults to light mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles to dark mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggle());

    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles back to light mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggle());
    act(() => result.current.toggle());

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists preference in localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggle());

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("reads initial value from localStorage", () => {
    localStorage.setItem("theme", "dark");

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("throws when used outside ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow();
  });
});
