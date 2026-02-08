import { Modal } from "./ui";

interface AddStarModalProps {
  errorMessage?: string;
  isError: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  playerName: string;
}

export default function AddStarModal({
  errorMessage,
  isError,
  isPending,
  onClose,
  onConfirm,
  open,
  playerName,
}: AddStarModalProps) {
  return (
    <Modal onClose={onClose} open={open} title="Confirmer l'étoile">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Attribuer une étoile à {playerName} ?
        </p>

        {isError && (
          <p className="text-center text-sm text-score-negative">
            {errorMessage ?? "Erreur inconnue"}
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
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Modal>
  );
}
