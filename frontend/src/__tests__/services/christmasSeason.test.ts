import { describe, expect, it } from "vitest";
import {
  getChristmasSnowDuration,
  getSleighChance,
  isChristmasPeriod,
  MAX_SNOW_DURATION_MS,
  MIN_SNOW_DURATION_MS,
} from "../../services/christmasSeason";

describe("christmasSeason", () => {
  describe("isChristmasPeriod", () => {
    it("returns false before December 15th", () => {
      expect(isChristmasPeriod(new Date(2026, 11, 14, 23, 59, 59))).toBe(false);
      expect(isChristmasPeriod(new Date(2026, 11, 1))).toBe(false);
      expect(isChristmasPeriod(new Date(2026, 7, 21))).toBe(false);
    });

    it("returns true on December 15th (start of period)", () => {
      expect(isChristmasPeriod(new Date(2026, 11, 15, 0, 0, 0))).toBe(true);
    });

    it("returns true between December 16th and December 31st", () => {
      expect(isChristmasPeriod(new Date(2026, 11, 24, 20, 0, 0))).toBe(true);
      expect(isChristmasPeriod(new Date(2026, 11, 25, 12, 0, 0))).toBe(true);
      expect(isChristmasPeriod(new Date(2026, 11, 31, 23, 59, 59))).toBe(true);
    });

    it("returns true on January 1st and January 2nd", () => {
      expect(isChristmasPeriod(new Date(2027, 0, 1, 0, 0, 0))).toBe(true);
      expect(isChristmasPeriod(new Date(2027, 0, 2, 23, 59, 59))).toBe(true);
    });

    it("returns false on January 3rd and later", () => {
      expect(isChristmasPeriod(new Date(2027, 0, 3, 0, 0, 0))).toBe(false);
      expect(isChristmasPeriod(new Date(2027, 0, 15))).toBe(false);
      expect(isChristmasPeriod(new Date(2027, 1, 1))).toBe(false);
    });
  });

  describe("getChristmasSnowDuration", () => {
    it("returns durations between 10s and 120s", () => {
      for (let i = 0; i < 50; i++) {
        const duration = getChristmasSnowDuration();
        expect(duration).toBeGreaterThanOrEqual(MIN_SNOW_DURATION_MS);
        expect(duration).toBeLessThanOrEqual(MAX_SNOW_DURATION_MS);
      }
    });
  });

  describe("getSleighChance", () => {
    it("returns the sleigh probability chance", () => {
      expect(getSleighChance()).toBeGreaterThan(0);
      expect(getSleighChance()).toBeLessThanOrEqual(1);
    });
  });
});
