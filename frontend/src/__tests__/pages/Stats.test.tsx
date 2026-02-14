import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as useGlobalStatsModule from "../../hooks/useGlobalStats";
import Stats from "../../pages/Stats";
import { renderWithProviders } from "../test-utils";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

vi.mock("../../hooks/useGlobalStats");

const mockStats = {
  averageGameDuration: 480,
  contractDistribution: [
    { contract: "petite" as const, count: 5, percentage: 50.0 },
    { contract: "garde" as const, count: 5, percentage: 50.0 },
  ],
  contractSuccessRateByPlayer: [],
  eloEvolution: [] as { history: { date: string; gameId: number; ratingAfter: number }[]; playerColor: string | null; playerId: number; playerName: string }[],
  eloRanking: [
    { eloRating: 1520, gamesPlayed: 5, playerId: 1, playerName: "Alice" },
    { eloRating: 1480, gamesPlayed: 5, playerId: 2, playerName: "Bob" },
  ],
  leaderboard: [
    {
      gamesAsTaker: 3,
      gamesPlayed: 10,
      playerId: 1,
      playerName: "Alice",
      totalScore: 250,
      winRate: 66.7,
      wins: 2,
    },
    {
      gamesAsTaker: 2,
      gamesPlayed: 10,
      playerId: 2,
      playerName: "Bob",
      totalScore: 100,
      winRate: 50.0,
      wins: 1,
    },
  ],
  totalGames: 10,
  totalPlayTime: 4800,
  totalSessions: 2,
  totalStars: 0,
};

describe("Stats page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: true,
      stats: null,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("shows error state when stats is null", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: null,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    expect(screen.getByText("Impossible de charger les statistiques")).toBeInTheDocument();
  });

  it("renders title and metrics", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    expect(screen.getByText("Statistiques")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("Donnes")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
  });

  it("renders leaderboard with player names", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    // Names appear in both Leaderboard and EloRanking
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
  });

  it("renders a section selector dropdown with all options", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    const selector = screen.getByRole("combobox", { name: "Section" });
    expect(selector).toBeInTheDocument();

    const options = within(selector).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "Classement ELO",
      "Évolution ELO",
      "Répartition des contrats",
      "Taux de réussite par contrat",
    ]);
  });

  it("shows ELO ranking by default and hides other sections", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    // ELO ranking visible by default
    expect(screen.getByText("1520")).toBeInTheDocument();
    expect(screen.getByText("1480")).toBeInTheDocument();

    // Other sections hidden
    expect(screen.queryByRole("heading", { name: "Évolution ELO" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Répartition des contrats" })).not.toBeInTheDocument();
  });

  it("switches visible section when dropdown changes", async () => {
    const user = userEvent.setup();
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    const selector = screen.getByRole("combobox", { name: "Section" });
    await user.selectOptions(selector, "contracts");

    // Contracts section visible
    expect(screen.getByRole("heading", { name: "Répartition des contrats" })).toBeInTheDocument();

    // ELO ranking hidden
    expect(screen.queryByText("1520")).not.toBeInTheDocument();
  });

  it("keeps metrics and leaderboard visible when switching sections", async () => {
    const user = userEvent.setup();
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    const selector = screen.getByRole("combobox", { name: "Section" });
    await user.selectOptions(selector, "contracts");

    // Metrics still visible
    expect(screen.getByText("Donnes")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();

    // Leaderboard still visible
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
  });

  it("renders duration stats when available", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    expect(screen.getByText("Durée moy. / donne")).toBeInTheDocument();
    expect(screen.getByText("8min")).toBeInTheDocument();
    expect(screen.getByText("Temps de jeu total")).toBeInTheDocument();
    expect(screen.getByText("1h 20min")).toBeInTheDocument();
  });

  it("does not render duration stats when averageGameDuration is null", () => {
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: { ...mockStats, averageGameDuration: null, totalPlayTime: 0 },
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    expect(screen.queryByText("Durée moy. / donne")).not.toBeInTheDocument();
  });

  it("navigates to player stats on leaderboard click", async () => {
    const user = userEvent.setup();
    vi.mocked(useGlobalStatsModule.useGlobalStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useGlobalStatsModule.useGlobalStats>);

    renderWithProviders(<Stats />);

    // Alice appears in both Leaderboard and EloRanking — click the first one
    await user.click(screen.getAllByText("Alice")[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/stats/player/1");
  });
});
