import { useState } from "react";
import type { LeaderboardEntry } from "../types/api";
import { LoadMoreButton, PAGE_SIZE, PlayerAvatar, ScoreDisplay } from "./ui";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onPlayerClick: (id: number) => void;
}

export default function Leaderboard({ entries, onPlayerClick }: LeaderboardProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        Aucune donnée disponible
      </p>
    );
  }

  const visibleEntries = entries.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-2">
      {visibleEntries.map((entry, index) => (
        <button
          className="flex items-center gap-3 rounded-xl bg-surface-elevated p-3 text-left transition-colors active:bg-surface-tertiary"
          key={entry.playerId}
          onClick={() => onPlayerClick(entry.playerId)}
          type="button"
        >
          <span className="w-6 text-center text-sm font-bold text-text-muted">
            {index + 1}
          </span>
          <PlayerAvatar color={entry.playerColor} name={entry.playerName} playerId={entry.playerId} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-medium text-text-primary">
              {entry.playerName}
            </span>
            <span className="text-xs text-text-muted">
              {entry.gamesPlayed} donnes · {entry.winRate}% victoires
            </span>
          </div>
          <ScoreDisplay animated={false} className="text-base" value={entry.totalScore} />
        </button>
      ))}
      <LoadMoreButton
        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        remainingCount={entries.length - visibleCount}
      />
    </div>
  );
}
