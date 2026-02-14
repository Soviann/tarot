import { screen } from "@testing-library/react";
import * as useSessionSummaryModule from "../../hooks/useSessionSummary";
import SessionSummary from "../../pages/SessionSummary";
import { renderWithProviders } from "../test-utils";

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: "1" }),
}));

vi.mock("../../hooks/useSessionSummary");

const mockSummary = {
  awards: [
    {
      description: "A infligé le plus de points",
      playerColor: null,
      playerId: 1,
      playerName: "Alice",
      title: "Le Boucher",
    },
  ],
  highlights: {
    bestGame: { contract: "garde", gameId: 1, playerName: "Alice", score: 180 },
    duration: 3600,
    lastPlace: { playerId: 2, playerName: "Bob", score: -100 },
    mostPlayedContract: { contract: "garde", count: 5 },
    mvp: { playerId: 1, playerName: "Alice", score: 200 },
    totalGames: 10,
    totalStars: 3,
    worstGame: { contract: "petite", gameId: 2, playerName: "Bob", score: -50 },
  },
  ranking: [
    { playerColor: null, playerId: 1, playerName: "Alice", position: 1, score: 200 },
    { playerColor: null, playerId: 3, playerName: "Charlie", position: 2, score: 50 },
    { playerColor: null, playerId: 4, playerName: "Diana", position: 3, score: 0 },
    { playerColor: null, playerId: 5, playerName: "Eve", position: 4, score: -50 },
    { playerColor: null, playerId: 2, playerName: "Bob", position: 5, score: -100 },
  ],
  scoreSpread: 300,
};

describe("SessionSummary page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when data is pending", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: undefined,
      isPending: true,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows error state when summary is null", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: undefined,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(
      screen.getByText("Impossible de charger le récapitulatif"),
    ).toBeInTheDocument();
  });

  it("renders all player names in ranking", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: mockSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    // Each player name appears in podium + full ranking, so use getAllByText
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Charlie").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Diana").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Eve").length).toBeGreaterThanOrEqual(1);
  });

  it("renders highlights section", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: mockSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByText("Faits marquants")).toBeInTheDocument();
    expect(screen.getByText("MVP")).toBeInTheDocument();
    expect(screen.getByText("Lanterne rouge")).toBeInTheDocument();
    expect(screen.getByText("Meilleure donne")).toBeInTheDocument();
    expect(screen.getByText("Pire donne")).toBeInTheDocument();
    expect(screen.getByText("Contrat favori")).toBeInTheDocument();
    expect(screen.getByText("Donnes jouées")).toBeInTheDocument();
  });

  it("renders awards section", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: mockSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByText("Distinctions")).toBeInTheDocument();
    expect(screen.getByText("Le Boucher")).toBeInTheDocument();
    expect(
      screen.getByText("A infligé le plus de points"),
    ).toBeInTheDocument();
  });

  it("renders session title with ID", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: mockSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByText("Récap Session #1")).toBeInTheDocument();
  });

  it("renders share and back buttons", () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: mockSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByText("Partager")).toBeInTheDocument();
    expect(screen.getByText("Retour à la session")).toBeInTheDocument();
  });
});
