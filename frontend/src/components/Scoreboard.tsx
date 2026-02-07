import type { CumulativeScore, GamePlayer } from "../types/api";
import { PlayerAvatar, ScoreDisplay } from "./ui";

interface ScoreboardProps {
  cumulativeScores: CumulativeScore[];
  players: GamePlayer[];
}

export default function Scoreboard({ cumulativeScores, players }: ScoreboardProps) {
  const scoreMap = new Map(
    cumulativeScores.map((s) => [s.playerId, s.score]),
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {players.map((player) => (
        <div
          className="flex min-w-16 flex-col items-center gap-1"
          key={player.id}
        >
          <PlayerAvatar name={player.name} playerId={player.id} size="sm" />
          <span className="max-w-16 truncate text-xs text-text-secondary">
            {player.name}
          </span>
          <ScoreDisplay animated={false} value={scoreMap.get(player.id) ?? 0} />
        </div>
      ))}
    </div>
  );
}
