import type { Game } from "../types/api";
import { ContractBadge, PlayerAvatar } from "./ui";

interface InProgressBannerProps {
  game: Game;
  onCancel?: () => void;
  onComplete: () => void;
}

export default function InProgressBanner({ game, onCancel, onComplete }: InProgressBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-accent-500/10 p-3">
      <PlayerAvatar name={game.taker.name} playerId={game.taker.id} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-text-primary">
          {game.taker.name}
        </span>
        <ContractBadge contract={game.contract} />
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <button
            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-500 lg:px-4 lg:py-2.5"
            onClick={onCancel}
            type="button"
          >
            Annuler
          </button>
        )}
        <button
          className="rounded-lg bg-accent-500 px-3 py-1.5 text-sm font-medium text-white lg:px-4 lg:py-2.5"
          onClick={onComplete}
          type="button"
        >
          Compléter
        </button>
      </div>
    </div>
  );
}
