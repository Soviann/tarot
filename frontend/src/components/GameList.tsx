import type { Game } from "../types/api";
import { formatDuration } from "../utils/formatDuration";
import { ContractBadge, PlayerAvatar, ScoreDisplay } from "./ui";

interface GameListProps {
  games: Game[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onDeleteLast: () => void;
  onEditLast: () => void;
  onLoadMore: () => void;
}

export default function GameList({
  games,
  hasNextPage,
  isFetchingNextPage,
  onDeleteLast,
  onEditLast,
  onLoadMore,
}: GameListProps) {
  if (games.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Aucune donne jouée
      </p>
    );
  }

  const maxPosition = games[0]?.position ?? 0;

  return (
    <>
      <ul className="space-y-2">
        {games.map((game) => {
          const takerScore =
            game.scoreEntries.find((e) => e.player.id === game.taker.id)
              ?.score ?? 0;
          const durationSeconds = game.completedAt
            ? Math.floor((new Date(game.completedAt).getTime() - new Date(game.createdAt).getTime()) / 1000)
            : null;

          return (
            <li
              className="rounded-xl bg-surface-card p-3"
              key={game.id}
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  name={game.taker.name}
                  playerId={game.taker.id}
                  size="sm"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {game.taker.name}
                    </span>
                    <ContractBadge className="shrink-0" contract={game.contract} />
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
                <div className="flex shrink-0 flex-col items-end">
                  <ScoreDisplay animated={false} value={takerScore} />
                  {durationSeconds !== null && (
                    <span className="text-xs text-text-muted">
                      {formatDuration(durationSeconds)}
                    </span>
                  )}
                </div>
              </div>
              {game.position === maxPosition && (
                <div className="mt-2 flex gap-2">
                  <button
                    className="flex-1 rounded-lg bg-surface-elevated px-3 py-1.5 text-sm font-medium text-text-secondary"
                    onClick={onEditLast}
                    type="button"
                  >
                    Modifier
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500"
                    onClick={onDeleteLast}
                    type="button"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {hasNextPage && (
        <button
          className="mt-2 w-full rounded-lg bg-surface-elevated px-3 py-1.5 text-sm font-medium text-text-secondary"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
          type="button"
        >
          {isFetchingNextPage ? "Chargement…" : "Voir plus"}
        </button>
      )}
    </>
  );
}
