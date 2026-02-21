import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as usePlayerStatsModule from "../../hooks/usePlayerStats";
import PlayerStats from "../../pages/PlayerStats";
import { renderWithProviders } from "../test-utils";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "1" }),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock("../../hooks/usePlayerGroups", () => ({
  usePlayerGroups: () => ({ groups: [], isPending: false }),
}));

vi.mock("../../hooks/usePlayerStats");

vi.mock("recharts", () => import("../mocks/recharts"));

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockStats = {
  averageGameDurationSeconds: 480,
  badges: [],
  averageScore: 8.6,
  bestGameScore: 240,
  contractDistribution: [
    { contract: "garde" as const, count: 8, winRate: 62.5, wins: 5 },
  ],
  eloHistory: [
    { date: "2026-02-07T12:00:00+00:00", gameId: 3, ratingAfter: 1520, ratingChange: 20 },
    { date: "2026-02-06T12:00:00+00:00", gameId: 2, ratingAfter: 1510, ratingChange: -10 },
  ],
  eloRating: 1520,
  gamesAsDefender: 90,
  gamesAsPartner: 20,
  gamesAsTaker: 35,
  gamesPlayed: 145,
  maxStarsInSession: 3,
  player: { color: null, id: 1, name: "Alice" },
  playerGroups: [{ id: 1, name: "Mardi soir" }],
  recentScores: [
    { date: "2026-02-07T12:00:00+00:00", gameId: 3, score: 120, sessionId: 1 },
    { date: "2026-02-06T12:00:00+00:00", gameId: 2, score: -60, sessionId: 1 },
    { date: "2026-02-05T12:00:00+00:00", gameId: 1, score: 80, sessionId: 1 },
  ],
  records: [
    { contract: "garde", date: "2026-02-07T12:00:00+00:00", sessionId: 1, type: "best_score", value: 240 },
    { contract: "petite", date: "2026-02-06T12:00:00+00:00", sessionId: 1, type: "worst_score", value: -360 },
    { contract: null, date: "2026-02-07T12:00:00+00:00", sessionId: null, type: "win_streak", value: 3 },
  ],
  sessionsPlayed: 10,
  sessionsWithStars: 0,
  starPenalties: 0,
  starsPerGame: 0,
  starsPerSession: 0,
  totalPlayTimeSeconds: 4800,
  totalStars: 0,
  winRateAsTaker: 57.1,
  worstGameScore: -360,
};

describe("PlayerStats page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: true,
      stats: null,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows not found when stats is null", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: null,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByRole("heading", { level: 1, name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
  });

  it("renders player name and key metrics", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("145")).toBeInTheDocument();
    expect(screen.getByText("Donnes jouées")).toBeInTheDocument();
    expect(screen.getByText("57.1%")).toBeInTheDocument();
    expect(screen.getByText("8.6")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders ELO rating metric", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("ELO")).toBeInTheDocument();
    expect(screen.getByText("1520")).toBeInTheDocument();
  });

  it("renders a section selector dropdown with all options", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Open the custom Select dropdown
    const trigger = screen.getByRole("button", { name: /records personnels/i });
    await user.click(trigger);

    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Records personnels",
      "Badges",
      "Répartition des rôles",
      "Contrats",
      "Évolution des scores",
      "Évolution ELO",
    ]);
  });

  it("shows records section by default and hides others", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Records visible by default
    expect(screen.getByText("Meilleur score")).toBeInTheDocument();
    expect(screen.getByText("Pire score")).toBeInTheDocument();

    // Other sections hidden (check section-specific content, not dropdown option text)
    expect(screen.queryByText("Preneur: 35")).not.toBeInTheDocument();
    expect(screen.queryByText("Contrats (preneur)")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Évolution des scores récents" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Évolution ELO" })).not.toBeInTheDocument();
  });

  it("switches visible section when dropdown changes", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Open custom Select and pick "Répartition des rôles"
    const trigger = screen.getByRole("button", { name: /records personnels/i });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /répartition des rôles/i }));

    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();

    // Records should be hidden (check content, not heading that's also in dropdown)
    expect(screen.queryByText("Meilleur score")).not.toBeInTheDocument();
  });

  it("keeps metrics visible regardless of selected section", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Open custom Select and pick "Évolution ELO"
    const trigger = screen.getByRole("button", { name: /records personnels/i });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /évolution elo/i }));

    // Metrics still visible
    expect(screen.getByText("145")).toBeInTheDocument();
    expect(screen.getByText("Donnes jouées")).toBeInTheDocument();
    expect(screen.getByText("ELO")).toBeInTheDocument();
  });

  it("keeps groups visible regardless of selected section", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Open custom Select and pick "Contrats"
    const trigger = screen.getByRole("button", { name: /records personnels/i });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /contrats/i }));

    // Groups still visible
    expect(screen.getByText("Mardi soir")).toBeInTheDocument();
  });

  it("renders duration metrics", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("Durée moy. / donne")).toBeInTheDocument();
    expect(screen.getByText("8min")).toBeInTheDocument();
    expect(screen.getByText("Temps de jeu total")).toBeInTheDocument();
    expect(screen.getByText("1h 20min")).toBeInTheDocument();
  });

  it("renders star section when player has stars", async () => {
    const user = userEvent.setup();
    const statsWithStars = {
      ...mockStats,
      maxStarsInSession: 3,
      sessionsWithStars: 4,
      starPenalties: 2,
      starsPerGame: 0.5,
      starsPerSession: 0.7,
      totalStars: 7,
    };
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: statsWithStars,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Open the custom Select dropdown
    const trigger = screen.getByRole("button", { name: /records personnels/i });
    await user.click(trigger);

    // "Étoiles" option should be available
    const starsOption = screen.getByRole("option", { name: /étoiles/i });
    expect(starsOption).toBeInTheDocument();

    // Select the star section
    await user.click(starsOption);

    // Check star stats are displayed
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/pénalité/i)).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(screen.getByText(/par donne/i)).toBeInTheDocument();
    expect(screen.getByText("0.7")).toBeInTheDocument();
    expect(screen.getByText(/par session/i)).toBeInTheDocument();
    expect(screen.getByText(/max en une session/i)).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(/sessions avec étoile/i)).toBeInTheDocument();
  });

  it("hides star section when player has no stars", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    // Open the custom Select dropdown
    const trigger = screen.getByRole("button", { name: /records personnels/i });
    await user.click(trigger);

    // "Étoiles" should NOT be in the options
    expect(screen.queryByRole("option", { name: /étoiles/i })).not.toBeInTheDocument();
  });

  it("navigates back to /stats on back button click", async () => {
    const user = userEvent.setup();
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    await user.click(screen.getByLabelText("Retour"));

    expect(mockNavigate).toHaveBeenCalledWith("/stats");
  });
});
