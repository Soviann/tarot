import { Play, Plus } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { useCreatePlayer } from "../hooks/useCreatePlayer";
import { usePlayers } from "../hooks/usePlayers";
import { ApiError } from "../services/api";
import { Modal, PlayerAvatar, SearchInput } from "./ui";

const DEFAULT_MAX_PLAYERS = 5;

interface PlayerSelectorProps {
  isPending?: boolean;
  maxPlayers?: number;
  onSelectionChange: (ids: number[]) => void;
  onStart?: () => void;
  selectedPlayerIds: number[];
}

export default function PlayerSelector({
  isPending: isStartPending = false,
  maxPlayers = DEFAULT_MAX_PLAYERS,
  onSelectionChange,
  onStart,
  selectedPlayerIds,
}: PlayerSelectorProps) {
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [clearKey, setClearKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { players: allPlayers } = usePlayers();
  const { isPending, players: searchedPlayers } = usePlayers(search);
  const createPlayer = useCreatePlayer();

  const players = searchedPlayers.filter((p) => p.active);

  const selectedPlayers = useMemo(
    () =>
      selectedPlayerIds
        .map((id) => allPlayers.find((p) => p.id === id))
        .filter(Boolean) as typeof allPlayers,
    [allPlayers, selectedPlayerIds],
  );

  const isFull = selectedPlayerIds.length >= maxPlayers;
  const listVisible = !!search && !isPending && players.length > 0;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setHighlightedIndex(null);
  }, []);

  const togglePlayer = useCallback(
    (playerId: number) => {
      if (selectedPlayerIds.includes(playerId)) {
        onSelectionChange(selectedPlayerIds.filter((id) => id !== playerId));
      } else if (!isFull) {
        onSelectionChange([...selectedPlayerIds, playerId]);
      }
    },
    [isFull, onSelectionChange, selectedPlayerIds],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!listVisible) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev === null ? 0 : Math.min(prev + 1, players.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev === null ? 0 : Math.max(prev - 1, 0),
          );
          break;
        case "Enter": {
          e.preventDefault();
          const targetIndex =
            highlightedIndex !== null
              ? highlightedIndex
              : players.length === 1
                ? 0
                : null;
          if (targetIndex === null) return;
          const player = players[targetIndex];
          const isDisabled =
            isFull && !selectedPlayerIds.includes(player.id);
          if (!isDisabled) {
            togglePlayer(player.id);
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          setHighlightedIndex(null);
          setClearKey((k) => k + 1);
          break;
      }
    },
    [highlightedIndex, isFull, listVisible, players, selectedPlayerIds, togglePlayer],
  );

  const removePlayer = useCallback(
    (playerId: number) => {
      onSelectionChange(selectedPlayerIds.filter((id) => id !== playerId));
    },
    [onSelectionChange, selectedPlayerIds],
  );

  const openModal = useCallback(() => {
    createPlayer.reset();
    setNewName(search);
    setModalOpen(true);
  }, [createPlayer, search]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = newName.trim();
      if (!trimmed) return;
      createPlayer.mutate(trimmed, {
        onSuccess: (player) => {
          closeModal();
          if (!isFull) {
            onSelectionChange([...selectedPlayerIds, player.id]);
          }
        },
      });
    },
    [closeModal, createPlayer, isFull, newName, onSelectionChange, selectedPlayerIds],
  );

  const isDuplicate =
    createPlayer.isError &&
    createPlayer.error instanceof ApiError &&
    createPlayer.error.status === 422;

  const highlightedPlayerId =
    highlightedIndex !== null ? players[highlightedIndex]?.id : undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* Chips des joueurs sélectionnés */}
      <div className="flex flex-wrap items-center justify-center gap-2" data-testid="selected-chips">
        {selectedPlayers.map((player) => (
          <button
            className="flex items-center gap-1 rounded-full bg-accent-100 py-1 pl-1 pr-2 text-sm font-medium text-accent-700 transition-colors hover:bg-accent-200"
            key={player.id}
            onClick={() => removePlayer(player.id)}
            type="button"
          >
            <PlayerAvatar color={player.color} name={player.name} playerId={player.id} size="sm" />
            <span>{player.name}</span>
          </button>
        ))}
        {Number.isFinite(maxPlayers) &&
          Array.from({ length: maxPlayers - selectedPlayerIds.length }).map(
            (_, i) => (
              <div
                className="flex size-8 items-center justify-center rounded-full border-2 border-dashed border-surface-border"
                key={`empty-${i}`}
              />
            ),
          )}
      </div>

      {Number.isFinite(maxPlayers) && (
        <p className="text-center text-sm text-text-muted">
          {selectedPlayerIds.length}/{maxPlayers} joueurs sélectionnés
        </p>
      )}

      {/* Recherche ou bouton Démarrer */}
      {isFull && onStart ? (
        <button
          className="w-full animate-fade-in rounded-lg bg-accent-500 py-3 font-semibold text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
          disabled={isStartPending}
          onClick={onStart}
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <Play size={20} />
            Démarrer la session
          </span>
        </button>
      ) : (
        <>
          <SearchInput
            clearKey={clearKey}
            inputProps={{
              "aria-activedescendant": highlightedPlayerId
                ? `player-option-${highlightedPlayerId}`
                : undefined,
              "aria-controls": listVisible ? "player-listbox" : undefined,
              "aria-expanded": listVisible,
              role: "combobox",
            }}
            onKeyDown={handleKeyDown}
            onSearch={handleSearch}
            placeholder="Rechercher un joueur…"
          />

          {/* Liste des joueurs (visible uniquement lors d'une recherche) */}
          {search && (
            <>
              {isPending && (
                <p className="py-4 text-center text-text-muted">Chargement…</p>
              )}

              {!isPending && players.length === 0 && (
                <p className="py-4 text-center text-text-muted">
                  Aucun joueur trouvé
                </p>
              )}

              {!isPending && players.length > 0 && (
                <ul className="flex flex-col gap-1" id="player-listbox" role="listbox">
                  {players.map((player, index) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const isDisabled = isFull && !isSelected;
                    const isHighlighted = highlightedIndex === index;

                    return (
                      <li
                        aria-disabled={isDisabled || undefined}
                        aria-selected={isSelected}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors ${
                          isSelected
                            ? "bg-accent-50 ring-2 ring-accent-500"
                            : isHighlighted
                              ? "bg-accent-100"
                              : "hover:bg-surface-secondary"
                        } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                        id={`player-option-${player.id}`}
                        key={player.id}
                        onClick={() => !isDisabled && togglePlayer(player.id)}
                        role="option"
                      >
                        <PlayerAvatar
                          color={player.color}
                          name={player.name}
                          playerId={player.id}
                          size="sm"
                        />
                        <span className="font-medium text-text-primary">
                          {player.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* Bouton créer joueur */}
          <button
            aria-label="Ajouter un joueur"
            className="flex items-center gap-2 rounded-lg border border-dashed border-surface-border p-2 text-sm text-text-muted transition-colors hover:border-accent-400 hover:text-accent-500"
            onClick={openModal}
            type="button"
          >
            <Plus size={16} />
            <span>Nouveau joueur</span>
          </button>
        </>
      )}

      {/* Modal création joueur */}
      <Modal onClose={closeModal} open={modalOpen} title="Nouveau joueur">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <input
              className="w-full rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du joueur"
              required
              type="text"
              value={newName}
            />
            {isDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Ce nom est déjà utilisé.
              </p>
            )}
            {createPlayer.isError && !isDuplicate && (
              <p className="mt-1 text-sm text-red-500">
                Erreur lors de la création.
              </p>
            )}
          </div>
          <button
            className="rounded-lg bg-accent-500 px-4 py-2 font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
            disabled={createPlayer.isPending}
            type="submit"
          >
            Ajouter
          </button>
        </form>
      </Modal>
    </div>
  );
}
