import { useEffect, useState } from "react";
import { useCreateSession } from "../hooks/useCreateSession";
import type { Session } from "../types/api";
import PlayerSelector from "./PlayerSelector";
import { Modal } from "./ui";

interface SwapPlayersModalProps {
  currentPlayerIds: number[];
  onClose: () => void;
  onSwap: (session: Session) => void;
  open: boolean;
}

export default function SwapPlayersModal({
  currentPlayerIds,
  onClose,
  onSwap,
  open,
}: SwapPlayersModalProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(currentPlayerIds);
  const createSession = useCreateSession();

  useEffect(() => {
    if (open) {
      setSelectedPlayerIds(currentPlayerIds);
      createSession.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    createSession.mutate(selectedPlayerIds, { onSuccess: onSwap });
  }

  return (
    <Modal onClose={onClose} open={open} title="Modifier les joueurs">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Sélectionnez 5 joueurs pour la nouvelle session. Si une session active existe avec ces
          joueurs, elle sera reprise.
        </p>

        <PlayerSelector
          onSelectionChange={setSelectedPlayerIds}
          selectedPlayerIds={selectedPlayerIds}
        />

        {createSession.isError && (
          <p className="text-center text-sm text-score-negative">
            {createSession.error?.message ?? "Erreur inconnue"}
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
            className="flex-1 rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            disabled={selectedPlayerIds.length !== 5 || createSession.isPending}
            onClick={handleConfirm}
            type="button"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  );
}
