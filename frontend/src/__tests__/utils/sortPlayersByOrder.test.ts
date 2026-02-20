import { describe, expect, it } from "vitest";
import { sortPlayersByOrder } from "../../utils/playerOrder";

const players = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Diana" },
  { id: 5, name: "Eve" },
];

describe("sortPlayersByOrder", () => {
  it("renvoie les joueurs inchangés quand playerOrder est null", () => {
    const result = sortPlayersByOrder(players, null);
    expect(result).toEqual(players);
  });

  it("trie les joueurs selon l'ordre personnalisé", () => {
    const result = sortPlayersByOrder(players, [5, 3, 1, 4, 2]);
    expect(result.map((p) => p.name)).toEqual([
      "Eve",
      "Charlie",
      "Alice",
      "Diana",
      "Bob",
    ]);
  });

  it("ignore les IDs absents de la liste des joueurs", () => {
    const result = sortPlayersByOrder(players, [5, 3, 99, 4, 2]);
    expect(result).toHaveLength(4);
    expect(result.map((p) => p.id)).toEqual([5, 3, 4, 2]);
  });
});
