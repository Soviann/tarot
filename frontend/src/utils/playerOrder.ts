export function sortPlayersByOrder<T extends { id: number }>(
  players: T[],
  playerOrder: number[] | null,
): T[] {
  if (!playerOrder) {
    return players;
  }

  const indexed = new Map(players.map((p) => [p.id, p]));
  const ordered: T[] = [];

  for (const id of playerOrder) {
    const player = indexed.get(id);
    if (player) {
      ordered.push(player);
    }
  }

  return ordered;
}
