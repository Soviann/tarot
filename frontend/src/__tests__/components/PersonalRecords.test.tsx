import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PersonalRecords from "../../components/PersonalRecords";
import type { Game, PersonalRecord } from "../../types/api";

vi.mock("../../services/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../services/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

import { apiFetch } from "../../services/api";

const mockApiFetch = vi.mocked(apiFetch);

afterEach(() => {
  vi.clearAllMocks();
});

const mockRecords: PersonalRecord[] = [
  { contract: "petite", date: "2026-01-15T14:00:00+00:00", gameId: 42, sessionId: 5, type: "best_score", value: 312 },
  { contract: "garde", date: "2026-01-10T10:00:00+00:00", gameId: 43, sessionId: 3, type: "worst_score", value: -180 },
  { contract: null, date: "2026-01-20T18:00:00+00:00", gameId: null, sessionId: null, type: "win_streak", value: 7 },
  { contract: null, date: "2026-01-12T09:00:00+00:00", gameId: null, sessionId: 5, type: "best_session", value: 540 },
  { contract: "garde_sans", date: "2026-01-18T16:00:00+00:00", gameId: 44, sessionId: 2, type: "biggest_diff", value: 25.5 },
];

const mockGame: Game = {
  chelem: "none",
  completedAt: "2026-01-15T15:00:00+00:00",
  contract: "petite",
  createdAt: "2026-01-15T14:00:00+00:00",
  dealer: null,
  id: 42,
  oudlers: 2,
  partner: { color: "#00f", id: 2, name: "Bob" },
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 45,
  position: 1,
  scoreEntries: [
    { id: 1, player: { color: "#f00", id: 1, name: "Alice" }, score: 58 },
    { id: 2, player: { color: "#00f", id: 2, name: "Bob" }, score: 29 },
    { id: 3, player: { color: "#0f0", id: 3, name: "Charlie" }, score: -29 },
  ],
  status: "completed",
  taker: { color: "#f00", id: 1, name: "Alice" },
} as unknown as Game;

function renderComponent(records: PersonalRecord[] = mockRecords) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PersonalRecords records={records} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PersonalRecords", () => {
  it("renders section title and all records", () => {
    renderComponent();
    expect(screen.getByText("Records personnels")).toBeInTheDocument();
    expect(screen.getByText("Meilleur score")).toBeInTheDocument();
    expect(screen.getByText("Pire score")).toBeInTheDocument();
    expect(screen.getByText("Série de victoires")).toBeInTheDocument();
    expect(screen.getByText("Meilleure session")).toBeInTheDocument();
    expect(screen.getByText("Plus grand écart")).toBeInTheDocument();
  });

  it("formats record values correctly", () => {
    renderComponent();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("\u2212180")).toBeInTheDocument();
    expect(screen.getByText("7 donnes")).toBeInTheDocument();
    expect(screen.getByText("540")).toBeInTheDocument();
    expect(screen.getByText("25.5 pts")).toBeInTheDocument();
  });

  it("renders nothing when records are empty", () => {
    const { container } = renderComponent([]);
    expect(container.firstChild).toBeNull();
  });

  it("shows Voir buttons for records with gameId and session links for best_session", () => {
    renderComponent();
    const buttons = screen.getAllByRole("button", { name: "Voir" });
    // Records with gameId: best_score, worst_score, biggest_diff → 3 buttons
    expect(buttons).toHaveLength(3);
    // best_session has sessionId but no gameId → shows as a link
    const links = screen.getAllByRole("link", { name: "Voir" });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/sessions/5");
  });

  it("opens game detail modal when clicking Voir on a game record", async () => {
    mockApiFetch.mockResolvedValueOnce(mockGame);
    const user = userEvent.setup();
    renderComponent();
    const buttons = screen.getAllByRole("button", { name: "Voir" });
    await user.click(buttons[0]); // Click "Voir" on best_score (gameId: 42)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Détail de la donne")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith("/games/42");
    });
  });

  it("closes game detail modal when clicking close", async () => {
    mockApiFetch.mockResolvedValueOnce(mockGame);
    const user = userEvent.setup();
    renderComponent();
    const buttons = screen.getAllByRole("button", { name: "Voir" });
    await user.click(buttons[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const closeButton = screen.getByRole("button", { name: "Fermer" });
    await user.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("displays game detail content in modal", async () => {
    mockApiFetch.mockResolvedValueOnce(mockGame);
    const user = userEvent.setup();
    renderComponent();
    const buttons = screen.getAllByRole("button", { name: "Voir" });
    await user.click(buttons[0]);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("Preneur")).toBeInTheDocument();
    expect(screen.getByText("Appelé")).toBeInTheDocument();
  });

  it("displays contract badges when contract is present", () => {
    renderComponent();
    expect(screen.getByText("Petite")).toBeInTheDocument();
    expect(screen.getByText("Garde")).toBeInTheDocument();
    expect(screen.getByText("Garde Sans")).toBeInTheDocument();
  });

  it("handles single win streak correctly", () => {
    renderComponent([
      { contract: null, date: "2026-01-20T18:00:00+00:00", gameId: null, sessionId: null, type: "win_streak", value: 1 },
    ]);
    expect(screen.getByText("1 donne")).toBeInTheDocument();
  });
});
