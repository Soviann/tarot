import { useMemo } from "react";
import type { CumulativeScore, GamePlayer } from "../types/api";
import { PlayerAvatar, ScoreDisplay } from "./ui";

// ♠ Pique, ♣ Trèfle, ♥ Coeur, ♦ Carreau (poids 2 chacun) + 🃏 Joker (poids 1)
// → ~22% par couleur, ~11% pour le joker
const SUITS: { path: string; weight: number }[] = [
  { path: "M12 2c0 0-7 6-7 10a4 4 0 003.5 4c1.2 0 2.3-.6 3-1.5L11 20h2l-.5-5.5c.7.9 1.8 1.5 3 1.5a4 4 0 003.5-4c0-4-7-10-7-10z", weight: 2 },
  { path: "M12 3a3.5 3.5 0 00-3.5 3.5c0 .4.1.8.2 1.2A3.5 3.5 0 005 11a3.5 3.5 0 003.5 3.5c.8 0 1.5-.2 2.1-.6L10 20h4l-.6-6.1c.6.4 1.3.6 2.1.6A3.5 3.5 0 0019 11a3.5 3.5 0 00-3.7-3.3c.1-.4.2-.8.2-1.2A3.5 3.5 0 0012 3z", weight: 2 },
  { path: "M12 21s-7-5.5-7-10.5C5 7.46 7.46 5 9.5 5c1.54 0 3.04.99 3.57 2.36h-2.14C11.46 5.99 12.96 5 14.5 5 16.54 5 19 7.46 19 10.5c0 5-7 10.5-7 10.5z", weight: 2 },
  { path: "M12 3L5 12l7 9 7-9z", weight: 2 },
  { path: "M12 2a3 3 0 00-3 3c0 1.1.6 2 1.5 2.6-.9.3-1.5 1.2-1.5 2.2 0 1 .6 1.8 1.4 2.1C9.5 12.5 9 13.6 9 15c0 2.2 1.3 4 3 4s3-1.8 3-4c0-1.4-.5-2.5-1.4-3.1.8-.3 1.4-1.1 1.4-2.1 0-1-.6-1.9-1.5-2.2C14.4 7 15 6.1 15 5a3 3 0 00-3-3z", weight: 1 },
];

const TOTAL_WEIGHT = SUITS.reduce((sum, s) => sum + s.weight, 0);

function pickRandomSuit(): string {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const suit of SUITS) {
    r -= suit.weight;
    if (r <= 0) return suit.path;
  }
  return SUITS[0].path;
}

interface ScoreboardProps {
  cumulativeScores: CumulativeScore[];
  currentDealerId: number | null;
  players: GamePlayer[];
}

export default function Scoreboard({ cumulativeScores, currentDealerId, players }: ScoreboardProps) {
  const scoreMap = new Map(
    cumulativeScores.map((s) => [s.playerId, s.score]),
  );

  // Nouveau tirage aléatoire uniquement quand le donneur change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const suitPath = useMemo(() => pickRandomSuit(), [currentDealerId]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {players.map((player) => (
        <div
          className="flex min-w-16 flex-col items-center gap-1"
          key={player.id}
        >
          <div className="relative">
            <PlayerAvatar name={player.name} playerId={player.id} size="sm" />
            {currentDealerId === player.id && (
              <span
                className="absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-white shadow-sm"
                title="Donneur"
              >
                <svg className="size-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d={suitPath} />
                </svg>
              </span>
            )}
          </div>
          <span className="max-w-16 truncate text-xs text-text-secondary">
            {player.name}
          </span>
          <ScoreDisplay animated={false} value={scoreMap.get(player.id) ?? 0} />
        </div>
      ))}
    </div>
  );
}
