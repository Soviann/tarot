import type { Badge, GamePlayer } from "../types/api";
import { Modal, PlayerAvatar } from "./ui";

interface BadgeUnlockedModalProps {
  newBadges: Record<string, Badge[]>;
  onClose: () => void;
  open: boolean;
  players: GamePlayer[];
}

export default function BadgeUnlockedModal({ newBadges, onClose, open, players }: BadgeUnlockedModalProps) {
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const entries = Object.entries(newBadges)
    .filter(([, badges]) => badges.length > 0)
    .sort(([a], [b]) => Number(a) - Number(b));

  if (entries.length === 0) return null;

  return (
    <Modal onClose={onClose} open={open} title="Nouveau(x) badge(s) débloqué(s) !">
      <div className="flex flex-col gap-4">
        {entries.map(([playerId, badges]) => {
          const player = playerMap.get(Number(playerId));
          if (!player) return null;
          return (
            <div key={playerId} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <PlayerAvatar color={player.color} name={player.name} playerId={player.id} size="sm" />
                <span className="text-sm font-semibold text-text-primary">{player.name}</span>
              </div>
              <div className="flex flex-col gap-1 pl-8">
                {badges.map((badge) => (
                  <div key={badge.type} className="flex items-center gap-2">
                    <span className="text-xl">{badge.emoji}</span>
                    <div>
                      <span className="text-sm font-medium text-text-primary">{badge.label}</span>
                      <span className="ml-1 text-xs text-text-muted">{badge.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button
          className="w-full rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white"
          onClick={onClose}
          type="button"
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}
