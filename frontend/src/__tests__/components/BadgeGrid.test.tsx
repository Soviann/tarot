import { render, screen } from "@testing-library/react";
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

describe("BadgeGrid", () => {
  it("renders badge count header", () => {
    render(<BadgeGrid badges={[unlockedBadge1, unlockedBadge2, lockedBadge]} />);

    expect(screen.getByText("Badges (2/3)")).toBeInTheDocument();
  });

  it("shows unlocked badges before locked ones", () => {
    render(<BadgeGrid badges={[lockedBadge, unlockedBadge1, unlockedBadge2]} />);

    const labels = screen.getAllByText(/Champion|Habitué|Légende/);
    expect(labels[0]).toHaveTextContent("Champion");
    expect(labels[1]).toHaveTextContent("Habitué");
    expect(labels[2]).toHaveTextContent("Légende");
  });

  it("shows unlock date for unlocked badges in fr-FR format", () => {
    render(<BadgeGrid badges={[unlockedBadge1]} />);

    expect(screen.getByText("15/06/2025")).toBeInTheDocument();
  });

  it("does not show date for locked badges", () => {
    render(<BadgeGrid badges={[lockedBadge]} />);

    expect(screen.getByText("Légende")).toBeInTheDocument();
    expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).not.toBeInTheDocument();
  });

  it("applies opacity class to locked badges", () => {
    render(<BadgeGrid badges={[lockedBadge]} />);

    const badgeContainer = screen.getByText("Légende").closest("div");
    expect(badgeContainer?.className).toContain("opacity-40");
  });
});
