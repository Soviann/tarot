import { ChevronDown, Layers } from "lucide-react";
import { useState } from "react";
import { REQUIRED_POINTS } from "../services/scoreCalculator";
import type { Game, ScoreEntry } from "../types/api";
import { formatDuration } from "../utils/formatDuration";
import { ContractBadge, EmptyState, PlayerAvatar, ScoreDisplay, Spinner } from "./ui";

interface GameListProps {
  games: Game[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isSessionActive: boolean;
  onDeleteLast: () => void;
  onEditLast: () => void;
  onLoadMore: () => void;
}

function formatScoreDiff(points: number, oudlers: number): string {
  const required = REQUIRED_POINTS[oudlers];
  const diff = Math.trunc(points) - required;
  return diff >= 0 ? `+${diff}` : `${diff}`;
}

function ScoreRow({ entry, role }: { entry: ScoreEntry; role?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <PlayerAvatar
          color={entry.player.color}
          name={entry.player.name}
          playerId={entry.player.id}
          size="sm"
        />
        <span className="text-sm text-text-primary">{entry.player.name}</span>
        {role && (
          <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">{role}</span>
        )}
      </div>
      <ScoreDisplay className="text-sm" value={entry.score} />
    </div>
  );
}

export default function GameList({
  games,
  hasNextPage,
  isFetchingNextPage,
  isSessionActive,
  onDeleteLast,
  onEditLast,
  onLoadMore,
}: GameListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (games.length === 0) {
    return (
      <EmptyState
        icon={<Layers size={40} />}
        message="Aucune donne jouée"
      />
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
          const isExpanded = expandedId === game.id;

          return (
            <li
              className="cursor-pointer rounded-xl bg-surface-card p-3"
              key={game.id}
              onClick={() => setExpandedId(isExpanded ? null : game.id)}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-semibold text-text-muted">
                  #{game.position}
                </span>
                <PlayerAvatar
                  color={game.taker.color}
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
                  <ScoreDisplay value={takerScore} />
                  {durationSeconds !== null && (
                    <span className="text-xs text-text-muted">
                      {formatDuration(durationSeconds)}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`shrink-0 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  size={16}
                />
              </div>
              {isExpanded && game.oudlers !== null && game.points !== null && (() => {
                const takerEntry = game.scoreEntries.find((e) => e.player.id === game.taker.id);
                const partnerEntry = game.partner
                  ? game.scoreEntries.find((e) => e.player.id === game.partner!.id)
                  : null;
                const defenseEntries = game.scoreEntries.filter(
                  (e) => e.player.id !== game.taker.id && e.player.id !== game.partner?.id,
                );

                return (
                  <div className="mt-2 border-t border-border pt-2">
                    <div className="mb-2 text-center text-xs text-text-muted">
                      {game.oudlers} {game.oudlers === 1 ? "bout" : "bouts"} · {formatScoreDiff(game.points, game.oudlers)}
                    </div>
                    <div className="space-y-1">
                      {takerEntry && <ScoreRow entry={takerEntry} role="Preneur" />}
                      {partnerEntry && <ScoreRow entry={partnerEntry} role="Appelé" />}
                      {defenseEntries.map((entry) => (
                        <ScoreRow entry={entry} key={entry.id} />
                      ))}
                    </div>
                  </div>
                );
              })()}
              {isSessionActive && game.position === maxPosition && (
                <div className="mt-2 flex gap-2">
                  <button
                    className="flex-1 rounded-lg bg-surface-elevated px-3 py-1.5 text-sm font-medium text-text-secondary"
                    onClick={(e) => { e.stopPropagation(); onEditLast(); }}
                    type="button"
                  >
                    Modifier
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500"
                    onClick={(e) => { e.stopPropagation(); onDeleteLast(); }}
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
          {isFetchingNextPage ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="text-text-secondary" inline size="xs" />
              Chargement…
            </span>
          ) : "Voir plus"}
        </button>
      )}
    </>
  );
}
