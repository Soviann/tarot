import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GameList from "../../components/GameList";
import { renderWithProviders } from "../test-utils";
import type { Game } from "../../types/api";

const baseGame: Game = {
  chelem: "none",
  contract: "garde",
  createdAt: "2025-02-01T14:00:00+00:00",
  id: 1,
  oudlers: 2,
  partner: { id: 2, name: "Bob" },
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: 56,
  position: 1,
  scoreEntries: [
    { id: 1, player: { id: 3, name: "Charlie" }, score: 120 },
    { id: 2, player: { id: 2, name: "Bob" }, score: 120 },
    { id: 3, player: { id: 1, name: "Alice" }, score: -80 },
    { id: 4, player: { id: 4, name: "Diana" }, score: -80 },
    { id: 5, player: { id: 5, name: "Eve" }, score: -80 },
  ],
  status: "completed",
  taker: { id: 3, name: "Charlie" },
};

const games: Game[] = [
  baseGame,
  {
    ...baseGame,
    contract: "petite",
    id: 2,
    partner: null,
    position: 2,
    scoreEntries: [
      { id: 6, player: { id: 1, name: "Alice" }, score: 200 },
      { id: 7, player: { id: 2, name: "Bob" }, score: -50 },
      { id: 8, player: { id: 3, name: "Charlie" }, score: -50 },
      { id: 9, player: { id: 4, name: "Diana" }, score: -50 },
      { id: 10, player: { id: 5, name: "Eve" }, score: -50 },
    ],
    taker: { id: 1, name: "Alice" },
  },
];

describe("GameList", () => {
  it("renders games in reverse position order (latest first)", () => {
    renderWithProviders(
      <GameList games={games} onDeleteLast={() => {}} onEditLast={() => {}} />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // First rendered should be position 2 (Petite), then position 1 (Garde)
    expect(items[0]).toHaveTextContent("Petite");
    expect(items[1]).toHaveTextContent("Garde");
  });

  it("shows taker name for each game", () => {
    renderWithProviders(
      <GameList games={games} onDeleteLast={() => {}} onEditLast={() => {}} />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("shows partner name or Seul", () => {
    renderWithProviders(
      <GameList games={games} onDeleteLast={() => {}} onEditLast={() => {}} />,
    );

    expect(screen.getByText("avec Bob")).toBeInTheDocument();
    expect(screen.getByText("Seul")).toBeInTheDocument();
  });

  it("shows taker score from scoreEntries", () => {
    renderWithProviders(
      <GameList games={games} onDeleteLast={() => {}} onEditLast={() => {}} />,
    );

    // Charlie's score in game 1: +120, Alice's score in game 2: +200
    expect(screen.getByText("+120")).toBeInTheDocument();
    expect(screen.getByText("+200")).toBeInTheDocument();
  });

  it("shows edit button only on the last game (highest position)", async () => {
    const onEditLast = vi.fn();
    renderWithProviders(
      <GameList games={games} onDeleteLast={() => {}} onEditLast={onEditLast} />,
    );

    const editButtons = screen.getAllByRole("button", { name: "Modifier" });
    expect(editButtons).toHaveLength(1);

    await userEvent.click(editButtons[0]);
    expect(onEditLast).toHaveBeenCalledOnce();
  });

  it("shows delete button only on the last game and calls onDeleteLast", async () => {
    const onDeleteLast = vi.fn();
    renderWithProviders(
      <GameList games={games} onDeleteLast={onDeleteLast} onEditLast={() => {}} />,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Supprimer" });
    expect(deleteButtons).toHaveLength(1);

    await userEvent.click(deleteButtons[0]);
    expect(onDeleteLast).toHaveBeenCalledOnce();
  });

  it("renders empty state when no games", () => {
    renderWithProviders(
      <GameList games={[]} onDeleteLast={() => {}} onEditLast={() => {}} />,
    );

    expect(screen.getByText("Aucune donne jouée")).toBeInTheDocument();
  });
});
