import { formatRelativeDate } from "../../services/formatRelativeDate";

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-15T14:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Aujourd'hui' for today", () => {
    expect(formatRelativeDate("2025-02-15T10:00:00")).toBe("Aujourd'hui");
  });

  it("returns 'Hier' for yesterday", () => {
    expect(formatRelativeDate("2025-02-14T22:00:00")).toBe("Hier");
  });

  it("returns 'Il y a X jours' for 2-7 days ago", () => {
    expect(formatRelativeDate("2025-02-13T10:00:00")).toBe("Il y a 2 jours");
    expect(formatRelativeDate("2025-02-08T10:00:00")).toBe("Il y a 7 jours");
  });

  it("returns absolute date for more than 7 days ago", () => {
    expect(formatRelativeDate("2025-02-07T10:00:00")).toMatch(/7 févr\. 2025/);
  });

  it("returns absolute date for dates far in the past", () => {
    expect(formatRelativeDate("2024-06-15T10:00:00")).toMatch(
      /15 juin 2024/,
    );
  });
});
