import { useState } from "react";
import type { StarRankingEntry } from "../types/api";
import { LoadMoreButton, PAGE_SIZE, PlayerAvatar } from "./ui";

interface WalkOfFameProps {
  entries: StarRankingEntry[];
  onPlayerClick: (id: number) => void;
}

export default function WalkOfFame({ entries, onPlayerClick }: WalkOfFameProps) {
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
          <span className="flex-1 truncate text-sm font-medium text-text-primary">
            {entry.playerName}
          </span>
          <span className="text-base font-bold text-yellow-400">
            {entry.stars} ⭐
          </span>
        </button>
      ))}
      <LoadMoreButton
        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
        remainingCount={entries.length - visibleCount}
      />
    </div>
  );
}
