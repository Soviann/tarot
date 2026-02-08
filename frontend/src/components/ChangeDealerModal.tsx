import { useState } from "react";
import type { GamePlayer } from "../types/api";
import { Modal, PlayerAvatar } from "./ui";

interface ChangeDealerModalProps {
  currentDealerId: number;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: (playerId: number) => void;
  open: boolean;
  players: GamePlayer[];
}

export default function ChangeDealerModal({
  currentDealerId,
  isPending = false,
  onClose,
  onConfirm,
  open,
  players,
}: ChangeDealerModalProps) {
  const [selectedId, setSelectedId] = useState<number>(currentDealerId);

  const canSubmit = selectedId !== currentDealerId && !isPending;

  return (
    <Modal onClose={onClose} open={open} title="Choisir le donneur">
      <div className="flex flex-col gap-5">
        <div className="flex justify-center gap-3">
          {players.map((player) => (
            <button
              aria-label={`Sélectionner ${player.name}`}
              className={`rounded-full p-0.5 transition-all ${
                selectedId === player.id ? "ring-2 ring-accent-500" : ""
              }`}
              key={player.id}
              onClick={() => setSelectedId(player.id)}
              type="button"
            >
              <PlayerAvatar name={player.name} playerId={player.id} size="lg" />
            </button>
          ))}
        </div>

        {selectedId && (
          <p className="text-center text-sm text-text-secondary">
            {players.find((p) => p.id === selectedId)?.name}
          </p>
        )}

        <button
          className="w-full rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
          disabled={!canSubmit}
          onClick={() => onConfirm(selectedId)}
          type="button"
        >
          Valider
        </button>
      </div>
    </Modal>
  );
}
