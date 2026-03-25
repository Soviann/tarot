import { getHintChance, isDoomWeek } from "../../services/doomWeek";

describe("isDoomWeek", () => {
  it("returns true on December 10", () => {
    expect(isDoomWeek(new Date(2025, 11, 10))).toBe(true);
  });

  // 2025: Dec 10 = Wednesday → week is Mon Dec 8 – Sun Dec 14
  it("returns true on Monday of the week containing Dec 10 (2025: Dec 8)", () => {
    expect(isDoomWeek(new Date(2025, 11, 8))).toBe(true);
  });

  it("returns true on Sunday of the week containing Dec 10 (2025: Dec 14)", () => {
    expect(isDoomWeek(new Date(2025, 11, 14))).toBe(true);
  });

  it("returns false the day before the week (2025: Dec 7)", () => {
    expect(isDoomWeek(new Date(2025, 11, 7))).toBe(false);
  });

  it("returns false the day after the week (2025: Dec 15)", () => {
    expect(isDoomWeek(new Date(2025, 11, 15))).toBe(false);
  });

  // 2026: Dec 10 = Thursday → week is Mon Dec 7 – Sun Dec 13
  it("returns true on Mon Dec 7 2026", () => {
    expect(isDoomWeek(new Date(2026, 11, 7))).toBe(true);
  });

  it("returns true on Sun Dec 13 2026", () => {
    expect(isDoomWeek(new Date(2026, 11, 13))).toBe(true);
  });

  it("returns false on Dec 6 2026", () => {
    expect(isDoomWeek(new Date(2026, 11, 6))).toBe(false);
  });

  // 2028: Dec 10 = Sunday → week is Mon Dec 4 – Sun Dec 10
  it("returns true on Mon Dec 4 2028 (Dec 10 is Sunday)", () => {
    expect(isDoomWeek(new Date(2028, 11, 4))).toBe(true);
  });

  it("returns false on Dec 11 2028 (next week)", () => {
    expect(isDoomWeek(new Date(2028, 11, 11))).toBe(false);
  });

  // 2023: Dec 10 = Sunday → week is Mon Dec 4 – Sun Dec 10
  // 2029: Dec 10 = Monday → week is Mon Dec 10 – Sun Dec 16
  it("returns true on Sun Dec 16 2029 (Dec 10 is Monday)", () => {
    expect(isDoomWeek(new Date(2029, 11, 16))).toBe(true);
  });

  it("returns false on Dec 9 2029 (previous week)", () => {
    expect(isDoomWeek(new Date(2029, 11, 9))).toBe(false);
  });

  it("returns false in January", () => {
    expect(isDoomWeek(new Date(2025, 0, 10))).toBe(false);
  });

  it("defaults to current date", () => {
    expect(typeof isDoomWeek()).toBe("boolean");
  });
});

describe("getHintChance", () => {
  it("returns 0.10 during doom week", () => {
    expect(getHintChance(new Date(2025, 11, 10))).toBe(0.1);
  });

  it("returns 0.02 outside doom week", () => {
    expect(getHintChance(new Date(2025, 5, 15))).toBe(0.02);
  });
});
