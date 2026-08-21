import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSeasonYear,
  SEASONAL_APPLIED_KEY,
  SEASONAL_DISMISSED_KEY,
  useSeasonalTheme,
} from "../../hooks/useSeasonalTheme";

const mockSetTheme = vi.fn();
let mockTheme = "light";
let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
    theme: mockTheme,
  }),
}));

describe("useSeasonalTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    mockSetTheme.mockClear();
    mockTheme = "light";
    mockResolvedTheme = "light";
  });

  it("calculates the correct season year for December and January", () => {
    expect(getSeasonYear(new Date(2026, 11, 25))).toBe("2026");
    expect(getSeasonYear(new Date(2027, 0, 1))).toBe("2026");
  });

  it("activates noel theme automatically when in Christmas period if not dismissed or applied", () => {
    const christmasDate = new Date(2026, 11, 20);
    renderHook(() => useSeasonalTheme(christmasDate));

    expect(mockSetTheme).toHaveBeenCalledWith("noel");
    expect(localStorage.getItem(SEASONAL_APPLIED_KEY)).toBe("2026");
  });

  it("does not activate noel theme if already applied for this season", () => {
    localStorage.setItem(SEASONAL_APPLIED_KEY, "2026");
    const christmasDate = new Date(2026, 11, 20);
    renderHook(() => useSeasonalTheme(christmasDate));

    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it("does not activate noel theme if dismissed by user for this season", () => {
    localStorage.setItem(SEASONAL_DISMISSED_KEY, "2026");
    const christmasDate = new Date(2026, 11, 20);
    renderHook(() => useSeasonalTheme(christmasDate));

    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it("reverts noel theme to system outside season if auto-applied", () => {
    localStorage.setItem(SEASONAL_APPLIED_KEY, "2026");
    mockTheme = "noel";
    mockResolvedTheme = "noel";
    const outsideDate = new Date(2027, 0, 15);
    renderHook(() => useSeasonalTheme(outsideDate));

    expect(mockSetTheme).toHaveBeenCalledWith("system");
    expect(localStorage.getItem(SEASONAL_APPLIED_KEY)).toBeNull();
  });
});
