import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useState } from "react";
import type { GamePlayer } from "../types/api";
import { Modal, PlayerAvatar } from "./ui";

interface ReorderPlayersModalProps {
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (playerIds: number[]) => void;
  open: boolean;
  players: GamePlayer[];
}

export default function ReorderPlayersModal({
  isPending = false,
  onClose,
  onConfirm,
  open,
  players,
}: ReorderPlayersModalProps) {
  const [order, setOrder] = useState<GamePlayer[]>(players);

  const initialIds = players.map((p) => p.id).join(",");
  const currentIds = order.map((p) => p.id).join(",");
  const hasChanged = initialIds !== currentIds;
  const canSubmit = hasChanged && !isPending;

  const move = useCallback((index: number, direction: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  return (
    <Modal onClose={onClose} open={open} title="Changer l'ordre">
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {order.map((player, index) => (
            <li
              className="flex items-center gap-3 rounded-xl bg-surface-secondary px-3 py-2"
              key={player.id}
            >
              <PlayerAvatar color={player.color} name={player.name} playerId={player.id} size="sm" />
              <span className="flex-1 text-sm font-medium text-text-primary">{player.name}</span>
              <button
                aria-label={`Monter ${player.name}`}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-primary disabled:opacity-30"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                type="button"
              >
                <ChevronUp size={18} />
              </button>
              <button
                aria-label={`Descendre ${player.name}`}
                className="rounded-lg p-1 text-text-secondary transition-colors hover:bg-surface-primary disabled:opacity-30"
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
                type="button"
              >
                <ChevronDown size={18} />
              </button>
            </li>
          ))}
        </ul>

        <button
          className="w-full rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
          disabled={!canSubmit}
          onClick={() => onConfirm(order.map((p) => p.id))}
          type="button"
        >
          Valider
        </button>
      </div>
    </Modal>
  );
}
