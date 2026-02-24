import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import * as useSessionSummaryModule from "../../hooks/useSessionSummary";
import SessionSummary from "../../pages/SessionSummary";
import { renderWithProviders } from "../test-utils";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: "1" }),
}));

vi.mock("../../hooks/useSessionSummary");

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockRejectedValue(new Error("Share failed")),
}));

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

  it("shows error toast when share fails", async () => {
    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: mockSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    const user = userEvent.setup();
    renderWithProviders(<SessionSummary />);

    await user.click(screen.getByText("Partager"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Échec du partage");
    });
  });

  it("renders podium with only one player", () => {
    const customSummary = {
      ...mockSummary,
      ranking: [
        {
          playerColor: null,
          playerId: 1,
          playerName: "Alice",
          position: 1,
          score: 200,
        },
      ],
    };

    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: customSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("🥈")).not.toBeInTheDocument();
    expect(screen.queryByText("🥉")).not.toBeInTheDocument();
  });

  it("renders podium with two players", () => {
    const customSummary = {
      ...mockSummary,
      ranking: [
        {
          playerColor: null,
          playerId: 1,
          playerName: "Alice",
          position: 1,
          score: 200,
        },
        {
          playerColor: null,
          playerId: 2,
          playerName: "Bob",
          position: 2,
          score: 50,
        },
      ],
    };

    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: customSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByText("🥇")).toBeInTheDocument();
    expect(screen.getByText("🥈")).toBeInTheDocument();
    expect(screen.queryByText("🥉")).not.toBeInTheDocument();
  });

  it("shows empty ranking message when no games", () => {
    const customSummary = {
      ...mockSummary,
      ranking: [],
      highlights: {
        ...mockSummary.highlights,
        totalGames: 0,
      },
    };

    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: customSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(
      screen.getByText("Aucune donne enregistrée"),
    ).toBeInTheDocument();
    expect(screen.queryByText("🥇")).not.toBeInTheDocument();
  });

  it("hides awards section when awards are empty", () => {
    const customSummary = {
      ...mockSummary,
      awards: [],
    };

    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: customSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.queryByText("Distinctions")).not.toBeInTheDocument();
  });

  it("renders highlights without optional fields", () => {
    const customSummary = {
      ...mockSummary,
      highlights: {
        bestGame: null,
        duration: 1800,
        lastPlace: null,
        mostPlayedContract: null,
        mvp: null,
        totalGames: 5,
        totalStars: 0,
        worstGame: null,
      },
    };

    vi.mocked(useSessionSummaryModule.useSessionSummary).mockReturnValue({
      data: customSummary,
      isPending: false,
    } as ReturnType<typeof useSessionSummaryModule.useSessionSummary>);

    renderWithProviders(<SessionSummary />);

    expect(screen.getByText("Faits marquants")).toBeInTheDocument();
    expect(screen.queryByText("MVP")).not.toBeInTheDocument();
    expect(screen.queryByText("Lanterne rouge")).not.toBeInTheDocument();
    expect(screen.queryByText("Meilleure donne")).not.toBeInTheDocument();
    expect(screen.queryByText("Pire donne")).not.toBeInTheDocument();
    expect(screen.queryByText("Contrat favori")).not.toBeInTheDocument();
    expect(screen.getByText("Durée")).toBeInTheDocument();
    expect(screen.getByText("Donnes jouées")).toBeInTheDocument();
    expect(screen.getByText("Étoiles")).toBeInTheDocument();
  });
});
