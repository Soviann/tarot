import type { Game } from "../types/api";
import { ContractBadge, PlayerAvatar, ScoreDisplay } from "./ui";

interface GameListProps {
  games: Game[];
  onDeleteLast: () => void;
  onEditLast: () => void;
}

export default function GameList({ games, onDeleteLast, onEditLast }: GameListProps) {
  if (games.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Aucune donne jouée
      </p>
    );
  }

  const maxPosition = Math.max(...games.map((g) => g.position));
  const sorted = [...games].sort((a, b) => b.position - a.position);

  return (
    <ul className="space-y-2">
      {sorted.map((game) => {
        const takerScore =
          game.scoreEntries.find((e) => e.player.id === game.taker.id)
            ?.score ?? 0;

        return (
          <li
            className="flex items-center gap-3 rounded-xl bg-surface-card p-3"
            key={game.id}
          >
            <PlayerAvatar
              name={game.taker.name}
              playerId={game.taker.id}
              size="sm"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {game.taker.name}
                </span>
                <ContractBadge contract={game.contract} />
              </div>
              <span className="text-xs text-text-muted">
                {game.partner ? `avec ${game.partner.name}` : "Seul"}
              </span>
              {game.dealer && (
                <span className="text-xs text-text-muted">
                  Donneur : {game.dealer.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ScoreDisplay animated={false} value={takerScore} />
              {game.position === maxPosition && (
                <>
                  <button
                    className="min-h-10 rounded-lg bg-surface-elevated px-2 py-1 text-xs font-medium text-text-secondary"
                    onClick={onEditLast}
                    type="button"
                  >
                    Modifier
                  </button>
                  <button
                    className="min-h-10 rounded-lg bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500"
                    onClick={onDeleteLast}
                    type="button"
                  >
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
