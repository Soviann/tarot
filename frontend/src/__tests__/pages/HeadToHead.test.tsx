import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as useHeadToHeadModule from "../../hooks/useHeadToHead";
import * as usePlayersModule from "../../hooks/usePlayers";
import HeadToHead from "../../pages/HeadToHead";
import { renderWithProviders } from "../test-utils";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("../../hooks/useHeadToHead");
vi.mock("../../hooks/usePlayers");
vi.mock("../../hooks/usePlayerGroups", () => ({
  usePlayerGroups: () => ({ groups: [] }),
}));

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const mockPlayers = [
  { active: true, color: "#ff0000", createdAt: "2026-01-01", id: 1, lastActivityAt: null, name: "Alice", playerGroups: [] },
  { active: true, color: "#0000ff", createdAt: "2026-01-01", id: 2, lastActivityAt: null, name: "Bob", playerGroups: [] },
  { active: true, color: "#00ff00", createdAt: "2026-01-01", id: 3, lastActivityAt: null, name: "Charlie", playerGroups: [] },
];

const mockStats = {
  globalPlayer1: {
    averageScore: 18.2,
    gamesAsTaker: 20,
    gamesPlayed: 50,
    playerColor: "#ff0000",
    playerId: 1,
    playerName: "Alice",
    totalScore: 910,
    winsAsTaker: 12,
  },
  globalPlayer2: {
    averageScore: -5.1,
    gamesAsTaker: 15,
    gamesPlayed: 40,
    playerColor: "#0000ff",
    playerId: 2,
    playerName: "Bob",
    totalScore: -204,
    winsAsTaker: 8,
  },
  player1: {
    averageScore: 25.5,
    calledOtherAsPartner: 2,
    gamesAsTaker: 5,
    gamesAsTakerVsOtherAsDefender: 3,
    playerColor: "#ff0000",
    playerId: 1,
    playerName: "Alice",
    totalScore: 510,
    winsAsTaker: 3,
    winsAsTakerVsOtherAsDefender: 2,
  },
  player2: {
    averageScore: -12.3,
    calledOtherAsPartner: 1,
    gamesAsTaker: 4,
    gamesAsTakerVsOtherAsDefender: 2,
    playerColor: "#0000ff",
    playerId: 2,
    playerName: "Bob",
    totalScore: -246,
    winsAsTaker: 2,
    winsAsTakerVsOtherAsDefender: 1,
  },
  sharedGames: 10,
  sharedSessions: 3,
};

function mockPlayersHook() {
  vi.mocked(usePlayersModule.usePlayers).mockReturnValue({
    players: mockPlayers,
  } as ReturnType<typeof usePlayersModule.usePlayers>);
}

describe("HeadToHead page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders player selectors", () => {
    mockPlayersHook();
    vi.mocked(useHeadToHeadModule.useHeadToHead).mockReturnValue({
      isFetching: false,
      isPending: false,
      stats: null,
    } as ReturnType<typeof useHeadToHeadModule.useHeadToHead>);

    renderWithProviders(<HeadToHead />);

    expect(screen.getByText("Comparaison face à face")).toBeInTheDocument();
    expect(screen.getByText("Joueur 1")).toBeInTheDocument();
    expect(screen.getByText("Joueur 2")).toBeInTheDocument();
  });

  it("shows empty state when no players are selected", () => {
    mockPlayersHook();
    vi.mocked(useHeadToHeadModule.useHeadToHead).mockReturnValue({
      isFetching: false,
      isPending: false,
      stats: null,
    } as ReturnType<typeof useHeadToHeadModule.useHeadToHead>);

    renderWithProviders(<HeadToHead />);

    expect(screen.getByText(/sélectionnez deux joueurs/i)).toBeInTheDocument();
  });

  it("shows spinner when fetching", () => {
    mockPlayersHook();
    vi.mocked(useHeadToHeadModule.useHeadToHead).mockReturnValue({
      isFetching: true,
      isPending: true,
      stats: null,
    } as ReturnType<typeof useHeadToHeadModule.useHeadToHead>);

    renderWithProviders(<HeadToHead />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays the three sections when stats are loaded", () => {
    mockPlayersHook();
    vi.mocked(useHeadToHeadModule.useHeadToHead).mockReturnValue({
      isFetching: false,
      isPending: false,
      stats: mockStats,
    } as ReturnType<typeof useHeadToHeadModule.useHeadToHead>);

    renderWithProviders(<HeadToHead />);

    // VS badge appears in both selector and stats area
    expect(screen.getAllByText("VS").length).toBeGreaterThanOrEqual(2);

    // Section 1: Stats globales
    expect(screen.getByText("Stats globales")).toBeInTheDocument();
    expect(screen.getByText("Toutes les parties de chaque joueur")).toBeInTheDocument();
    expect(screen.getByText("910")).toBeInTheDocument(); // Alice global total
    expect(screen.getByText("-204")).toBeInTheDocument(); // Bob global total

    // Section 2: Stats en commun
    expect(screen.getByText("Stats en commun")).toBeInTheDocument();
    expect(screen.getByText("Parties jouées ensemble")).toBeInTheDocument();
    expect(screen.getByText(/3 session/)).toBeInTheDocument();
    expect(screen.getByText(/10 donne/)).toBeInTheDocument();
    expect(screen.getByText("510")).toBeInTheDocument(); // Alice shared total
    expect(screen.getByText("-246")).toBeInTheDocument(); // Bob shared total

    // Section 3: Face à face
    expect(screen.getByText("Face à face")).toBeInTheDocument();
    expect(screen.getByText("Quand l'un prend contre l'autre")).toBeInTheDocument();
  });

  it("navigates back to stats on back button click", async () => {
    const user = userEvent.setup();
    mockPlayersHook();
    vi.mocked(useHeadToHeadModule.useHeadToHead).mockReturnValue({
      isFetching: false,
      isPending: false,
      stats: null,
    } as ReturnType<typeof useHeadToHeadModule.useHeadToHead>);

    renderWithProviders(<HeadToHead />);

    const backButton = screen.getByRole("button", { name: /retour/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/stats");
  });
});
