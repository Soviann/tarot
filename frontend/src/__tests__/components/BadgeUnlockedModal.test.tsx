import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BadgeUnlockedModal from "../../components/BadgeUnlockedModal";
import type { Badge, GamePlayer } from "../../types/api";
import { renderWithProviders } from "../test-utils";

const players: GamePlayer[] = [
  { color: "#e74c3c", id: 1, name: "Alice" },
  { color: "#3498db", id: 2, name: "Bob" },
];

const badgeA: Badge = {
  description: "Gagner 10 parties",
  emoji: "🏆",
  label: "Champion",
  type: "champion",
  unlockedAt: "2025-06-15T10:30:00+00:00",
};

const badgeB: Badge = {
  description: "Jouer 50 parties",
  emoji: "🎮",
  label: "Habitué",
  type: "regular",
  unlockedAt: "2025-07-20T14:00:00+00:00",
};

describe("BadgeUnlockedModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no badges", () => {
    const { container } = renderWithProviders(
      <BadgeUnlockedModal newBadges={{}} onClose={vi.fn()} open={true} players={players} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders player names and badges", () => {
    renderWithProviders(
      <BadgeUnlockedModal
        newBadges={{ "1": [badgeA] }}
        onClose={vi.fn()}
        open={true}
        players={players}
      />,
    );

    expect(screen.getByText("Nouveau(x) badge(s) débloqué(s) !")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByText("Gagner 10 parties")).toBeInTheDocument();
  });

  it("calls onClose when Fermer button is clicked", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <BadgeUnlockedModal
        newBadges={{ "1": [badgeA] }}
        onClose={onClose}
        open={true}
        players={players}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "Fermer" });
    await userEvent.click(buttons[buttons.length - 1]);

    expect(onClose).toHaveBeenCalled();
  });

  it("shows badges for multiple players", () => {
    renderWithProviders(
      <BadgeUnlockedModal
        newBadges={{ "1": [badgeA], "2": [badgeB] }}
        onClose={vi.fn()}
        open={true}
        players={players}
      />,
    );

    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByText("Habitué")).toBeInTheDocument();
  });
});
