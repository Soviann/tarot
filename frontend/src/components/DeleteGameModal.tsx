import { useEffect } from "react";
import { useDeleteGame } from "../hooks/useDeleteGame";
import type { Game } from "../types/api";
import { Modal } from "./ui";

interface DeleteGameModalProps {
  game: Game;
  onClose: () => void;
  open: boolean;
  sessionId: number;
}

export default function DeleteGameModal({ game, onClose, open, sessionId }: DeleteGameModalProps) {
  const deleteGame = useDeleteGame(game.id, sessionId);

  useEffect(() => {
    if (open) deleteGame.reset();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    deleteGame.mutate(undefined, { onSuccess: () => onClose() });
  }

  return (
    <Modal onClose={onClose} open={open} title="Supprimer la donne">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Êtes-vous sûr de vouloir supprimer cette donne ? Les scores seront recalculés.
        </p>

        {deleteGame.isError && (
          <p className="text-center text-sm text-score-negative">
            {deleteGame.error?.message ?? "Erreur inconnue"}
          </p>
        )}

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-semibold text-text-secondary transition-colors"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            disabled={deleteGame.isPending}
            onClick={handleConfirm}
            type="button"
          >
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  );
}
