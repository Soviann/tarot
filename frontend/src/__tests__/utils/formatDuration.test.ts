import { formatDuration } from "../../utils/formatDuration";

describe("formatDuration", () => {
  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(65)).toBe("1min 5s");
  });

  it("formats exact minutes without seconds", () => {
    expect(formatDuration(120)).toBe("2min");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3661)).toBe("1h 1min");
  });

  it("formats exact hours without minutes", () => {
    expect(formatDuration(7200)).toBe("2h");
  });

  it("formats hours only when no remaining minutes", () => {
    expect(formatDuration(3600)).toBe("1h");
  });

  it("ignores seconds when hours are present", () => {
    expect(formatDuration(3665)).toBe("1h 1min");
  });

  it("handles large values", () => {
    expect(formatDuration(86400)).toBe("24h");
  });
});
