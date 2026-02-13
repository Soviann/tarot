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

const mockStats = {
  averageGameDurationSeconds: 480,
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
  player: { id: 1, name: "Alice" },
  playerGroups: [{ id: 1, name: "Mardi soir" }],
  recentScores: [
    { date: "2026-02-07T12:00:00+00:00", gameId: 3, score: 120, sessionId: 1 },
    { date: "2026-02-06T12:00:00+00:00", gameId: 2, score: -60, sessionId: 1 },
    { date: "2026-02-05T12:00:00+00:00", gameId: 1, score: 80, sessionId: 1 },
  ],
  sessionsPlayed: 10,
  starPenalties: 0,
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

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("shows not found when stats is null", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: null,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("Joueur introuvable")).toBeInTheDocument();
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

  it("renders ELO evolution chart section", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("Évolution ELO")).toBeInTheDocument();
  });

  it("renders best and worst scores", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("+240")).toBeInTheDocument();
    expect(screen.getByText("-360")).toBeInTheDocument();
  });

  it("renders role breakdown", () => {
    vi.mocked(usePlayerStatsModule.usePlayerStats).mockReturnValue({
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof usePlayerStatsModule.usePlayerStats>);

    renderWithProviders(<PlayerStats />);

    expect(screen.getByText("Preneur: 35")).toBeInTheDocument();
    expect(screen.getByText("Partenaire: 20")).toBeInTheDocument();
    expect(screen.getByText("Défenseur: 90")).toBeInTheDocument();
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
