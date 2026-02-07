import { useEffect, useState } from "react";
import type { useCreateGame } from "../hooks/useCreateGame";
import type { GamePlayer } from "../types/api";
import { Contract } from "../types/enums";
import type { Contract as ContractType } from "../types/enums";
import { Modal, PlayerAvatar } from "./ui";

interface NewGameModalProps {
  createGame: ReturnType<typeof useCreateGame>;
  onClose: () => void;
  open: boolean;
  players: GamePlayer[];
}

const contracts: { colorClass: string; label: string; value: ContractType }[] = [
  { colorClass: "bg-contract-petite", label: "Petite", value: Contract.Petite },
  { colorClass: "bg-contract-garde", label: "Garde", value: Contract.Garde },
  { colorClass: "bg-contract-garde-sans", label: "Garde Sans", value: Contract.GardeSans },
  { colorClass: "bg-contract-garde-contre", label: "Garde Contre", value: Contract.GardeContre },
];

export default function NewGameModal({ createGame, onClose, open, players }: NewGameModalProps) {
  const [selectedContract, setSelectedContract] = useState<ContractType | null>(null);
  const [selectedTakerId, setSelectedTakerId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedContract(null);
      setSelectedTakerId(null);
      createGame.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit = selectedTakerId !== null && selectedContract !== null && !createGame.isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    createGame.mutate(
      { contract: selectedContract, takerId: selectedTakerId },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <Modal onClose={onClose} open={open} title="Nouvelle donne">
      <div className="flex flex-col gap-5">
        {/* Preneur */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">Preneur</h3>
          <div className="flex justify-center gap-3">
            {players.map((player) => (
              <button
                className={`rounded-full p-0.5 transition-all ${
                  selectedTakerId === player.id ? "ring-2 ring-accent-500" : ""
                }`}
                key={player.id}
                onClick={() => setSelectedTakerId(player.id)}
                type="button"
              >
                <PlayerAvatar name={player.name} playerId={player.id} size="lg" />
              </button>
            ))}
          </div>
          {selectedTakerId && (
            <p className="mt-1 text-center text-sm text-text-secondary">
              {players.find((p) => p.id === selectedTakerId)?.name}
            </p>
          )}
        </div>

        {/* Contrat */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">Contrat</h3>
          <div className="grid grid-cols-2 gap-2">
            {contracts.map(({ colorClass, label, value }) => (
              <button
                className={`${colorClass} rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all ${
                  selectedContract === value ? "ring-2 ring-offset-2 ring-offset-surface-primary ring-white" : "opacity-80"
                }`}
                key={value}
                onClick={() => setSelectedContract(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Erreur */}
        {createGame.isError && (
          <p className="text-center text-sm text-score-negative">
            {createGame.error?.message ?? "Erreur inconnue"}
          </p>
        )}

        {/* Valider */}
        <button
          className="w-full rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
          disabled={!canSubmit}
          onClick={handleSubmit}
          type="button"
        >
          Valider
        </button>
      </div>
    </Modal>
  );
}
