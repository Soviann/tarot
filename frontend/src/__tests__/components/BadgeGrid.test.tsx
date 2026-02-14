import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BadgeGrid from "../../components/BadgeGrid";
import type { Badge } from "../../types/api";

const unlockedBadge1: Badge = {
  description: "Gagner 10 parties",
  emoji: "🏆",
  label: "Champion",
  type: "champion",
  unlockedAt: "2025-06-15T10:30:00+00:00",
};

const unlockedBadge2: Badge = {
  description: "Jouer 50 parties",
  emoji: "🎮",
  label: "Habitué",
  type: "regular",
  unlockedAt: "2025-07-20T14:00:00+00:00",
};

const lockedBadge: Badge = {
  description: "Gagner 100 parties",
  emoji: "👑",
  label: "Légende",
  type: "legend",
  unlockedAt: null,
};

const lockedBadge2: Badge = {
  description: "Jouer 200 parties",
  emoji: "💎",
  label: "Diamant",
  type: "diamond",
  unlockedAt: null,
};

describe("BadgeGrid", () => {
  it("renders badge count header", () => {
    render(<BadgeGrid badges={[unlockedBadge1, unlockedBadge2, lockedBadge]} />);

    expect(screen.getByText("Badges (2/3)")).toBeInTheDocument();
  });

  it("shows only unlocked badges by default", () => {
    render(<BadgeGrid badges={[lockedBadge, unlockedBadge1, unlockedBadge2]} />);

    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByText("Habitué")).toBeInTheDocument();
    expect(screen.queryByText("Légende")).not.toBeInTheDocument();
  });

  it("shows toggle button with locked count when locked badges exist", () => {
    render(<BadgeGrid badges={[unlockedBadge1, lockedBadge, lockedBadge2]} />);

    expect(screen.getByRole("button", { name: /voir les 2 restants/i })).toBeInTheDocument();
  });

  it("reveals locked badges when toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(<BadgeGrid badges={[unlockedBadge1, lockedBadge, lockedBadge2]} />);

    expect(screen.queryByText("Légende")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /voir les 2 restants/i }));

    expect(screen.getByText("Légende")).toBeInTheDocument();
    expect(screen.getByText("Diamant")).toBeInTheDocument();
  });

  it("hides locked badges again when toggle button is clicked twice", async () => {
    const user = userEvent.setup();
    render(<BadgeGrid badges={[unlockedBadge1, lockedBadge]} />);

    await user.click(screen.getByRole("button", { name: /voir/i }));
    expect(screen.getByText("Légende")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /masquer/i }));
    expect(screen.queryByText("Légende")).not.toBeInTheDocument();
  });

  it("does not show toggle button when all badges are unlocked", () => {
    render(<BadgeGrid badges={[unlockedBadge1, unlockedBadge2]} />);

    expect(screen.queryByRole("button", { name: /voir|masquer/i })).not.toBeInTheDocument();
  });

  it("does not show toggle button when there are no badges", () => {
    render(<BadgeGrid badges={[]} />);

    expect(screen.queryByRole("button", { name: /voir|masquer/i })).not.toBeInTheDocument();
  });

  it("shows unlock date for unlocked badges in fr-FR format", () => {
    render(<BadgeGrid badges={[unlockedBadge1]} />);

    expect(screen.getByText("15/06/2025")).toBeInTheDocument();
  });

  it("shows description instead of date for locked badges when revealed", async () => {
    const user = userEvent.setup();
    render(<BadgeGrid badges={[unlockedBadge1, lockedBadge]} />);

    await user.click(screen.getByRole("button", { name: /voir/i }));

    expect(screen.getByText("Légende")).toBeInTheDocument();
    expect(screen.getByText("Gagner 100 parties")).toBeInTheDocument();
  });

  it("applies opacity class to locked badges when revealed", async () => {
    const user = userEvent.setup();
    render(<BadgeGrid badges={[unlockedBadge1, lockedBadge]} />);

    await user.click(screen.getByRole("button", { name: /voir/i }));

    const badgeContainer = screen.getByText("Légende").closest("div");
    expect(badgeContainer?.className).toContain("opacity-40");
  });
});
